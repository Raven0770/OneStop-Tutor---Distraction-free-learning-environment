from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Course, Video, VideoProgress, User
from schemas import VideoCreate, VideoUpdate, VideoResponse
from auth import get_current_user
from youtube_utils import extract_youtube_id, get_youtube_metadata, validate_youtube_url

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/{course_id}/add", response_model=VideoResponse)
async def add_video_to_course(
    course_id: int,
    video_data: VideoCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a YouTube video to a course."""
    # Check course ownership
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add videos to this course"
        )
    
    # Validate YouTube URL
    if not validate_youtube_url(video_data.youtube_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube URL"
        )
    
    # Extract video ID
    youtube_id = extract_youtube_id(video_data.youtube_url)
    
    # Get metadata
    metadata = get_youtube_metadata(youtube_id)
    
    # Get next position
    last_video = db.query(Video).filter(Video.course_id == course_id).order_by(Video.position.desc()).first()
    next_position = (last_video.position + 1) if last_video else 0
    
    # Create video
    new_video = Video(
        course_id=course_id,
        youtube_url=video_data.youtube_url,
        youtube_video_id=youtube_id,
        title=video_data.title or metadata.get("title", "Untitled Video"),
        description=video_data.description,
        position=next_position
    )
    
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    
    # Initialize progress tracking for current user
    progress = VideoProgress(
        user_id=current_user["user_id"],
        video_id=new_video.id,
        course_id=course_id,
        last_timestamp=0,
        completed=False
    )
    db.add(progress)
    db.commit()
    
    return VideoResponse.from_orm(new_video)


@router.get("/course/{course_id}/list", response_model=List[VideoResponse])
async def get_course_videos(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all videos in a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check authorization
    if course.user_id != current_user["user_id"] and not course.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    videos = db.query(Video).filter(Video.course_id == course_id).order_by(Video.position).all()
    return [VideoResponse.from_orm(video) for video in videos]


@router.patch("/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: int,
    video_data: VideoUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update video details."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check authorization
    course = db.query(Course).filter(Course.id == video.course_id).first()
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update fields
    if video_data.title is not None:
        video.title = video_data.title
    if video_data.description is not None:
        video.description = video_data.description
    
    db.commit()
    db.refresh(video)
    
    return VideoResponse.from_orm(video)


@router.post("/{video_id}/reorder")
async def reorder_video(
    video_id: int,
    new_position: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder video position in course."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check authorization
    course = db.query(Course).filter(Course.id == video.course_id).first()
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    old_position = video.position
    
    # Get all videos in course
    videos = db.query(Video).filter(Video.course_id == video.course_id).order_by(Video.position).all()
    
    # Reorder
    if new_position < old_position:
        # Moving up
        for v in videos:
            if new_position <= v.position < old_position and v.id != video_id:
                v.position += 1
    else:
        # Moving down
        for v in videos:
            if old_position < v.position <= new_position and v.id != video_id:
                v.position -= 1
    
    video.position = new_position
    db.commit()
    
    return {"message": "Video reordered successfully"}


@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a video from course."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check authorization
    course = db.query(Course).filter(Course.id == video.course_id).first()
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Delete related progress records
    db.query(VideoProgress).filter(VideoProgress.video_id == video_id).delete()
    
    # Delete video
    db.delete(video)
    db.commit()
    
    return {"message": "Video deleted successfully"}
