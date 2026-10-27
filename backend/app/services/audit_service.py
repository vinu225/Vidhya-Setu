import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.models import AuditEvent

class AuditService:
    @staticmethod
    def record_event(
        db: Session,
        actor_username: str,
        actor_role: str,
        action: str,
        description: str,
        institution_id: str = None,
        ip_address: str = "127.0.0.1"
    ) -> AuditEvent:
        # Generate tamper hash chaining with timestamp
        now = datetime.now(timezone.utc)
        payload = f"{actor_username}|{actor_role}|{action}|{description}|{now.isoformat()}"
        tamper_hash = hashlib.sha256(payload.encode()).hexdigest()

        event = AuditEvent(
            actor_username=actor_username,
            actor_role=actor_role,
            action=action,
            description=description,
            institution_id=institution_id,
            ip_address=ip_address,
            tamper_hash=tamper_hash,
            created_at=now
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
