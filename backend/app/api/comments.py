from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.comment import Comment
from app.models.report import Report
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(tags=["comments"])


@router.post("/reports/{report_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    report_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if not comment_in.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment cannot be empty")

    comment = Comment(
        content=comment_in.content.strip(),
        report_id=report_id,
        user_id=current_user.id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    out = CommentOut.model_validate(comment)
    out.username = current_user.username
    return out


@router.get("/reports/{report_id}/comments", response_model=list[CommentOut])
def get_comments(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all comments for a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    comments = (
        db.query(Comment)
        .filter(Comment.report_id == report_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    result = []
    for c in comments:
        out = CommentOut.model_validate(c)
        out.username = c.user.username if c.user else None
        result.append(out)
    return result
