from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import Timestamp, Video
from pydantic import BaseModel

router = APIRouter(prefix="/api/timestamps", tags=["timestamps"])


class TimestampCreate(BaseModel):
    video_id: int
    time_seconds: float
    label: str
    note: str = None


class TimestampUpdate(BaseModel):
    time_seconds: float = None
    label: str = None
    note: str = None


class TimestampResponse(BaseModel):
    id: int
    video_id: int
    time_seconds: float
    label: str
    note: str = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=TimestampResponse)
async def create_timestamp(
    timestamp_data: TimestampCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new timestamp for a video."""
    # Verify video exists
    video = db.query(Video).filter(Video.id == timestamp_data.video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )

    # Create timestamp
    timestamp = Timestamp(
        video_id=timestamp_data.video_id,
        user_id=current_user["id"],
        time_seconds=timestamp_data.time_seconds,
        label=timestamp_data.label,
        note=timestamp_data.note
    )

    db.add(timestamp)
    db.commit()
    db.refresh(timestamp)

    return timestamp


@router.get("/video/{video_id}")
async def get_video_timestamps(
    video_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all timestamps for a specific video."""
    # Verify video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )

    timestamps = db.query(Timestamp).filter(
        Timestamp.video_id == video_id,
        Timestamp.user_id == current_user["id"]
    ).order_by(Timestamp.time_seconds).all()

    return timestamps


@router.put("/{timestamp_id}", response_model=TimestampResponse)
async def update_timestamp(
    timestamp_id: int,
    timestamp_data: TimestampUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a timestamp."""
    timestamp = db.query(Timestamp).filter(
        Timestamp.id == timestamp_id,
        Timestamp.user_id == current_user["id"]
    ).first()

    if not timestamp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timestamp not found"
        )

    # Update fields if provided
    if timestamp_data.time_seconds is not None:
        timestamp.time_seconds = timestamp_data.time_seconds
    if timestamp_data.label is not None:
        timestamp.label = timestamp_data.label
    if timestamp_data.note is not None:
        timestamp.note = timestamp_data.note

    timestamp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(timestamp)

    return timestamp


@router.delete("/{timestamp_id}")
async def delete_timestamp(
    timestamp_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a timestamp."""
    timestamp = db.query(Timestamp).filter(
        Timestamp.id == timestamp_id,
        Timestamp.user_id == current_user["id"]
    ).first()

    if not timestamp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timestamp not found"
        )

    db.delete(timestamp)
    db.commit()

    return {"message": "Timestamp deleted successfully"}
