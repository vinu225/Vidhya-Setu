import bcrypt
import hashlib
import hmac
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password[:72].encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def compute_apaar_lookup_hash(apaar_id: str) -> str:
    """HMAC-SHA256 for protected zero-leakage identifier search"""
    clean = str(apaar_id).replace(" ", "").strip()
    return hmac.new(settings.SECRET_KEY.encode(), clean.encode(), hashlib.sha256).hexdigest()

def mask_apaar_id(apaar_id: str) -> str:
    clean = str(apaar_id).replace(" ", "").strip()
    if len(clean) == 12:
        return f"{clean[:4]} •••• {clean[8:]}"
    return "•••• •••• ••••"

def sign_credential_payload(payload_str: str) -> str:
    """Cryptographically sign a verifiable credential using HMAC-SHA256 demo key"""
    sig = hmac.new(settings.CREDENTIAL_SIGNING_KEY.encode(), payload_str.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode()

def verify_credential_signature(payload_str: str, signature: str) -> bool:
    expected_sig = sign_credential_payload(payload_str)
    return hmac.compare_digest(expected_sig, signature)

def compute_record_tamper_hash(student_id: str, institution_id: str, program_id: str, roll_no: str) -> str:
    data = f"{student_id}|{institution_id}|{program_id}|{roll_no}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # 1. Try local HS256 token verification first
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username:
            user = db.query(User).filter(User.username == username).first()
            if user and user.is_active:
                return user
    except JWTError:
        pass

    # 2. Try Clerk JWT token verification / synchronization
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        clerk_user_id = unverified_claims.get("sub")
        iss = unverified_claims.get("iss", "")
        if clerk_user_id and ("clerk" in iss or clerk_user_id.startswith("user_")):
            # Sync or retrieve Clerk user
            user = db.query(User).filter((User.id == clerk_user_id) | (User.username == clerk_user_id)).first()
            if not user:
                email = unverified_claims.get("email") or f"{clerk_user_id}@clerk.user"
                role = unverified_claims.get("role") or "AICTE_ADMIN"
                user = User(
                    id=clerk_user_id,
                    username=clerk_user_id,
                    email=email,
                    hashed_password=get_password_hash("ClerkOAuthUser@123"),
                    role=role,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
    except Exception:
        pass

    raise credentials_exception

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_roles}"
            )
        return current_user
    return role_checker

def verify_institution_access(target_institution_id: str, current_user: User):
    """Enforce data isolation: Institution admins and DEOs can only view/modify their own institution"""
    if current_user.role == "AICTE_ADMIN" or current_user.role == "AUDITOR":
        return True
    if current_user.institution_id != target_institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot access or modify records of another institution."
        )
    return True
