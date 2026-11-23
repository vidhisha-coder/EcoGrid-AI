import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, JSON, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReportCategory(str, enum.Enum):
    waste = "waste"
    water_pollution = "water_pollution"
    air_pollution = "air_pollution"
    deforestation = "deforestation"
    noise = "noise"
    other = "other"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"


class ReportPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SAEnum(ReportCategory), default=ReportCategory.other, nullable=False)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.pending, nullable=False)
    priority = Column(SAEnum(ReportPriority), default=ReportPriority.medium, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)

    image_path = Column(String(500), nullable=True)
    ai_analysis = Column(JSON, nullable=True)

    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of = Column(Integer, ForeignKey("reports.id"), nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id], backref="reports_filed")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="reports_assigned")
    comments = relationship("Comment", back_populates="report", cascade="all, delete-orphan")
    original_report = relationship("Report", remote_side=[id], foreign_keys=[duplicate_of])
