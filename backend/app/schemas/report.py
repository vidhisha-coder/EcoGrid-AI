from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from app.models.report import ReportCategory, ReportStatus, ReportPriority


class ReportCreate(BaseModel):
    title: str
    description: str
    category: Optional[ReportCategory] = ReportCategory.other
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ReportCategory] = None
    status: Optional[ReportStatus] = None
    priority: Optional[ReportPriority] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    assigned_to: Optional[int] = None
    is_duplicate: Optional[bool] = None
    duplicate_of: Optional[int] = None


class ReporterInfo(BaseModel):
    id: int
    username: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    id: int
    title: str
    description: str
    category: ReportCategory
    status: ReportStatus
    priority: ReportPriority
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    image_path: Optional[str] = None
    ai_analysis: Optional[dict[str, Any]] = None
    reporter_id: int
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_duplicate: bool
    duplicate_of: Optional[int] = None

    model_config = {"from_attributes": True}


class ReportWithDetails(ReportOut):
    reporter: Optional[ReporterInfo] = None
    reporter_username: Optional[str] = None
    comments_count: int = 0
    assigned_volunteer_name: Optional[str] = None
