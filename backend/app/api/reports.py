
import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict

import aiofiles
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.comment import Comment
from app.models.report import (
    Report,
    ReportCategory,
    ReportPriority,
    ReportStatus,
)
from app.models.user import User, UserRole
from app.schemas.report import (
    ReportOut,
    ReportUpdate,
    ReportWithDetails,
    ReporterInfo,
)
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


def _get_ai_service() -> AIService:
    return AIService(api_key=settings.GEMINI_API_KEY)


def _report_to_detail(report: Report, db: Session) -> ReportWithDetails:
    """Convert a Report ORM object to ReportWithDetails schema."""

    comments_count = (
        db.query(func.count(Comment.id))
        .filter(Comment.report_id == report.id)
        .scalar()
        or 0
    )

    reporter_info: Optional[ReporterInfo] = None

    if report.reporter:
        reporter_info = ReporterInfo(
            id=report.reporter.id,
            username=report.reporter.username,
            email=report.reporter.email,
            role=report.reporter.role.value,
        )

    assigned_name: Optional[str] = None

    if report.assignee:
        assigned_name = report.assignee.username

    detail = ReportWithDetails(
        **ReportOut.model_validate(report).model_dump(),
        reporter=reporter_info,
        reporter_username=(
            report.reporter.username
            if report.reporter
            else "Unknown"
        ),
        comments_count=comments_count,
        assigned_volunteer_name=assigned_name,
    )

    return detail


# ---------------------------------------------------------------------------
# POST /reports - Create a new report
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ReportWithDetails,
    status_code=status.HTTP_201_CREATED,
)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    category: Optional[ReportCategory] = Form(ReportCategory.other),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an environmental report with optional image upload and AI analysis."""

    image_path: Optional[str] = None

    # Save uploaded image
    if image and image.filename:

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        ext = os.path.splitext(image.filename)[1].lower()

        if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format. Use JPG, PNG, GIF or WEBP.",
            )

        filename = f"{uuid.uuid4().hex}{ext}"
        image_path = os.path.join(settings.UPLOAD_DIR, filename)

        async with aiofiles.open(image_path, "wb") as f:
            content = await image.read()
            await f.write(content)

    # AI analysis
    ai_analysis: Optional[dict] = None
    ai_category = category
    ai_priority = ReportPriority.medium

    if image_path:
        try:
            ai_service = _get_ai_service()

            ai_analysis = await ai_service.analyze_image(image_path)

            detected_cat = ai_analysis.get("category")

            if detected_cat and detected_cat in ReportCategory.__members__:
                ai_category = ReportCategory(detected_cat)

            detected_pri = ai_analysis.get("priority")

            if detected_pri and detected_pri in ReportPriority.__members__:
                ai_priority = ReportPriority(detected_pri)

        except Exception as exc:
            logger.warning(
                "AI analysis failed, proceeding without it: %s",
                exc,
            )

    # Duplicate detection
    is_duplicate = False
    duplicate_of_id: Optional[int] = None

    try:
        recent_reports = (
            db.query(Report)
            .filter(
                Report.status == ReportStatus.pending,
                Report.is_duplicate.is_(False),
            )
            .order_by(Report.created_at.desc())
            .limit(50)
            .all()
        )

        existing = [
            {
                "id": r.id,
                "description": r.description,
            }
            for r in recent_reports
        ]

        if existing:
            ai_service = _get_ai_service()

            dup_result = await ai_service.check_duplicate(
                description,
                existing,
            )

            if (
                dup_result.get("is_duplicate")
                and dup_result.get("duplicate_of_id")
            ):
                duplicate_id = dup_result["duplicate_of_id"]

                # Only use a duplicate ID that actually exists.
                duplicate_exists = (
                    db.query(Report.id)
                    .filter(Report.id == duplicate_id)
                    .first()
                )

                if duplicate_exists:
                    is_duplicate = True
                    duplicate_of_id = duplicate_id

    except Exception as exc:
        logger.warning(
            "Duplicate check failed, skipping: %s",
            exc,
        )

    # Create report
    report = Report(
        title=title,
        description=description,
        category=ai_category or ReportCategory.other,
        priority=ai_priority,
        latitude=latitude,
        longitude=longitude,
        address=address,
        image_path=image_path,
        ai_analysis=ai_analysis,
        reporter_id=current_user.id,
        is_duplicate=is_duplicate,
        duplicate_of=duplicate_of_id,
    )

    try:
        db.add(report)
        db.commit()
        db.refresh(report)

    except Exception:
        db.rollback()
        logger.exception("Failed to create report")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create report",
        )

    return _report_to_detail(report, db)


# ---------------------------------------------------------------------------
# GET /reports - List reports
# ---------------------------------------------------------------------------

@router.get("")
def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[ReportStatus] = Query(None, alias="status"),
    category: Optional[ReportCategory] = Query(None),
    priority: Optional[ReportPriority] = Query(None),
    search: Optional[str] = Query(None, min_length=1, max_length=200),
    sort: str = Query("created_at_desc"),
    reporter_id: Optional[int] = Query(None, ge=1),
    assigned_to: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List reports with role-based visibility."""

    query = db.query(Report)

    if current_user.role == UserRole.citizen:

        query = query.filter(
            Report.reporter_id == current_user.id
        )

    elif current_user.role == UserRole.volunteer:

        query = query.filter(
            (Report.assigned_to == current_user.id)
            | (Report.status == ReportStatus.pending)
        )

    if reporter_id is not None:
        query = query.filter(
            Report.reporter_id == reporter_id
        )

    if assigned_to is not None:
        query = query.filter(
            Report.assigned_to == assigned_to
        )

    if status_filter:
        query = query.filter(
            Report.status == status_filter
        )

    if category:
        query = query.filter(
            Report.category == category
        )

    if priority:
        query = query.filter(
            Report.priority == priority
        )

    if search:
        term = f"%{search.strip()}%"

        query = query.filter(
            (Report.title.ilike(term))
            | (Report.description.ilike(term))
        )

    sort_options = {
        "created_at_desc": Report.created_at.desc(),
        "created_at_asc": Report.created_at.asc(),
        "priority_desc": Report.priority.desc(),
    }

    query = query.order_by(
        sort_options.get(sort, Report.created_at.desc())
    )

    total = query.count()

    reports = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "reports": [
            _report_to_detail(report, db)
            for report in reports
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


# ---------------------------------------------------------------------------
# GET /reports/map/hotspots
# ---------------------------------------------------------------------------

@router.get("/map/hotspots")
def get_hotspots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return geographic report clusters."""

    rows = (
        db.query(
            Report.latitude,
            Report.longitude,
            Report.category,
            Report.status,
        )
        .filter(
            Report.latitude.isnot(None),
            Report.longitude.isnot(None),
        )
        .all()
    )

    clusters = {}

    for lat, lng, cat, stat in rows:

        key = (round(lat, 2), round(lng, 2))

        if key not in clusters:
            clusters[key] = {
                "latitude": key[0],
                "longitude": key[1],
                "count": 0,
                "categories": defaultdict(int),
            }

        clusters[key]["count"] += 1
        clusters[key]["categories"][cat.value] += 1

    result = []

    for cluster in clusters.values():

        result.append({
            "latitude": cluster["latitude"],
            "longitude": cluster["longitude"],
            "count": cluster["count"],
            "categories": dict(cluster["categories"]),
        })

    return result


# ---------------------------------------------------------------------------
# GET /reports/analytics/summary
# ---------------------------------------------------------------------------

@router.get("/analytics/summary")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return dashboard analytics summary."""

    total = (
        db.query(func.count(Report.id)).scalar()
        or 0
    )

    by_status_rows = (
        db.query(
            Report.status,
            func.count(Report.id),
        )
        .group_by(Report.status)
        .all()
    )

    by_status = {
        row[0].value: row[1]
        for row in by_status_rows
    }

    by_category_rows = (
        db.query(
            Report.category,
            func.count(Report.id),
        )
        .group_by(Report.category)
        .all()
    )

    by_category = {
        row[0].value: row[1]
        for row in by_category_rows
    }

    by_priority_rows = (
        db.query(
            Report.priority,
            func.count(Report.id),
        )
        .group_by(Report.priority)
        .all()
    )

    by_priority = {
        row[0].value: row[1]
        for row in by_priority_rows
    }

    resolved = by_status.get("resolved", 0)

    resolution_rate = (
        round((resolved / total) * 100, 2)
        if total > 0
        else 0.0
    )

    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    trend_rows = (
        db.query(
            func.date(Report.created_at),
            func.count(Report.id),
        )
        .filter(Report.created_at >= seven_days_ago)
        .group_by(func.date(Report.created_at))
        .order_by(func.date(Report.created_at))
        .all()
    )

    recent_trend = [
        {
            "date": str(row[0]),
            "count": row[1],
        }
        for row in trend_rows
    ]

    return {
        "total_reports": total,
        "by_status": by_status,
        "by_category": by_category,
        "by_priority": by_priority,
        "resolution_rate": resolution_rate,
        "recent_trend": recent_trend,
    }


# ---------------------------------------------------------------------------
# GET /reports/{report_id}
# ---------------------------------------------------------------------------

@router.get("/{report_id}", response_model=ReportWithDetails)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single report."""

    report = (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if (
        current_user.role == UserRole.citizen
        and report.reporter_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if (
        current_user.role == UserRole.volunteer
        and report.assigned_to != current_user.id
        and report.status != ReportStatus.pending
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return _report_to_detail(report, db)


# ---------------------------------------------------------------------------
# PUT /reports/{report_id}
# ---------------------------------------------------------------------------

@router.put("/{report_id}", response_model=ReportWithDetails)
def update_report(
    report_id: int,
    update_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Securely update reports based on user roles."""

    report = (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    update_dict = update_data.model_dump(
        exclude_unset=True
    )

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided",
        )

    # CITIZEN
    if current_user.role == UserRole.citizen:

        if report.reporter_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own reports",
            )

        if report.status != ReportStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only edit pending reports",
            )

        allowed_fields = {
            "title",
            "description",
            "category",
            "latitude",
            "longitude",
            "address",
        }

        invalid_fields = set(update_dict) - allowed_fields

        if invalid_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to update these fields",
            )

    # VOLUNTEER
    elif current_user.role == UserRole.volunteer:

        if report.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update reports assigned to you",
            )

        allowed_fields = {"status"}

        invalid_fields = set(update_dict) - allowed_fields

        if invalid_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Volunteers can only update report status",
            )

    # AUTHORITY
    elif current_user.role == UserRole.authority:
        pass

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update reports",
        )

    if (
        "status" in update_dict
        and update_dict["status"] is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report status cannot be empty",
        )

    # Apply updates
    for field, value in update_dict.items():
        setattr(report, field, value)

    report.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(report)

    except Exception:
        db.rollback()

        logger.exception(
            "Failed to update report %s",
            report_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update report",
        )

    return _report_to_detail(report, db)


# ---------------------------------------------------------------------------
# DELETE /reports/{report_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("authority")),
):
    """Delete a report. Authority only."""

    report = (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    db.delete(report)
    db.commit()
