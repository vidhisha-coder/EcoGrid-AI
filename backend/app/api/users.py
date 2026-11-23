from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("authority")),
):
    """List all users. Authority only."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.put("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("authority")),
):
    """Update a user's role. Authority only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


@router.get("/volunteers", response_model=list[UserOut])
def list_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all users with volunteer or authority role (for assignment dropdown)."""
    volunteers = (
        db.query(User)
        .filter(User.role.in_([UserRole.volunteer, UserRole.authority]), User.is_active == True)
        .order_by(User.username)
        .all()
    )
    return volunteers
