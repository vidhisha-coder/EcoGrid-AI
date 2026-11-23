from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    report_id: int
    user_id: int
    created_at: datetime
    username: Optional[str] = None

    model_config = {"from_attributes": True}
