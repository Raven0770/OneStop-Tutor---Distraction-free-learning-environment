from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import VideoProgress, PomodoroSession, Video, Course
from schemas import VideoProgressResponse, VideoProgressUpdate, PomodoroSessionResponse, PomodoroSessionCreate
from auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("/video/{video_id}", response_model=VideoProgressResponse)
async def update_video_progress(
    video_id: int,
    progress_data: VideoProgressUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update or create video progress."""
    # Get video and course
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get existing progress or create new
    progress = db.query(VideoProgress).filter(
        VideoProgress.user_id == current_user["user_id"],
        VideoProgress.video_id == video_id
    ).first()
    
    if not progress:
        progress = VideoProgress(
            user_id=current_user["user_id"],
            video_id=video_id,
            course_id=video.course_id
        )
        db.add(progress)
    
    # Update fields
    if progress_data.last_timestamp is not None:
        progress.last_timestamp = progress_data.last_timestamp
    if progress_data.completed is not None:
        progress.completed = progress_data.completed
    
    progress.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(progress)
    
    return VideoProgressResponse.from_orm(progress)


@router.get("/video/{video_id}", response_model=VideoProgressResponse)
async def get_video_progress(
    video_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress for a specific video."""
    progress = db.query(VideoProgress).filter(
        VideoProgress.user_id == current_user["user_id"],
        VideoProgress.video_id == video_id
    ).first()
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found"
        )
    
    return VideoProgressResponse.from_orm(progress)


@router.get("/course/{course_id}")
async def get_course_progress(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress for all videos in a course."""
    # Verify course ownership or access
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"] and not course.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Get all progress records
    progress_records = db.query(VideoProgress).filter(
        VideoProgress.course_id == course_id,
        VideoProgress.user_id == current_user["user_id"]
    ).all()
    
    return {
        "course_id": course_id,
        "progress": [VideoProgressResponse.from_orm(p) for p in progress_records]
    }


@router.post("/pomodoro/start", response_model=PomodoroSessionResponse)
async def start_pomodoro_session(
    session_data: PomodoroSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new Pomodoro session."""
    session = PomodoroSession(
        user_id=current_user["user_id"],
        duration=session_data.duration,
        completed=False
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return PomodoroSessionResponse.from_orm(session)


@router.patch("/pomodoro/{session_id}", response_model=PomodoroSessionResponse)
async def complete_pomodoro_session(
    session_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark Pomodoro session as completed."""
    session = db.query(PomodoroSession).filter(
        PomodoroSession.id == session_id,
        PomodoroSession.user_id == current_user["user_id"]
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.completed = True
    db.commit()
    db.refresh(session)
    
    return PomodoroSessionResponse.from_orm(session)


@router.get("/pomodoro/stats")
async def get_pomodoro_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Pomodoro session statistics for user."""
    total_sessions = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user["user_id"]
    ).count()
    
    completed_sessions = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user["user_id"],
        PomodoroSession.completed == True
    ).count()
    
    total_duration = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user["user_id"],
        PomodoroSession.completed == True
    ).with_entities(db.func.sum(PomodoroSession.duration)).scalar() or 0
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_duration_minutes": total_duration // 60,
        "completion_rate": (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
    }
