from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.models import User, Institution
from app.schemas.schemas import UserLogin, Token, UserResponse
from app.security.security import verify_password, create_access_token, get_current_user, require_roles
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive")

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "inst_id": user.institution_id})

    # Fetch institution name if user is institution scoped
    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    AuditService.record_event(
        db,
        actor_username=user.username,
        actor_role=user.role,
        action="USER_LOGIN",
        description=f"User {user.username} logged in with role {user.role}",
        institution_id=user.institution_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "institution_id": user.institution_id,
            "institution_name": inst_name
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="USER_LOGOUT",
        description=f"User {current_user.username} logged out",
        institution_id=current_user.institution_id
    )
    return {"message": "Successfully logged out"}

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    return db.query(User).all()
