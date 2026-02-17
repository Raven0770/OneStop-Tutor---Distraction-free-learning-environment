from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from database import get_db
from models import Course, Video, VideoProgress, User
from schemas import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse, VideoResponse
from auth import get_current_user
from youtube_utils import extract_youtube_id, get_youtube_metadata, validate_youtube_url

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course."""
    new_course = Course(
        user_id=current_user["user_id"],
        title=course_data.title,
        description=course_data.description,
        is_public=course_data.is_public,
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return CourseResponse.from_orm(new_course)


@router.get("/", response_model=List[CourseResponse])
async def get_user_courses(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses for current user."""
    courses = db.query(Course).filter(Course.user_id == current_user["user_id"]).all()
    return [CourseResponse.from_orm(course) for course in courses]


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed course information with videos."""
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
            detail="Not authorized to view this course"
        )
    
    # Get videos ordered by position
    videos = db.query(Video).filter(Video.course_id == course_id).order_by(Video.position).all()
    
    response = CourseDetailResponse.from_orm(course)
    response.videos = [VideoResponse.from_orm(video) for video in videos]
    
    return response


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update course details."""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this course"
        )
    
    # Update fields
    if course_data.title is not None:
        course.title = course_data.title
    if course_data.description is not None:
        course.description = course_data.description
    if course_data.is_public is not None:
        course.is_public = course_data.is_public
    
    db.commit()
    db.refresh(course)
    
    return CourseResponse.from_orm(course)


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this course"
        )
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}


@router.get("/{course_id}/progress")
async def get_course_progress(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course progress statistics."""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Get video count
    total_videos = db.query(Video).filter(Video.course_id == course_id).count()
    
    # Get completed count
    completed_videos = db.query(VideoProgress).filter(
        VideoProgress.course_id == course_id,
        VideoProgress.user_id == current_user["user_id"],
        VideoProgress.completed == True
    ).count()
    
    progress_percentage = (completed_videos / total_videos * 100) if total_videos > 0 else 0
    
    return {
        "course_id": course_id,
        "total_videos": total_videos,
        "completed_videos": completed_videos,
        "progress_percentage": round(progress_percentage, 2),
        "remaining_videos": total_videos - completed_videos
    }


@router.post("/{course_id}/share")
async def share_course(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate shareable link for course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Generate share token if not exists
    if not course.share_token:
        course.share_token = str(uuid.uuid4())
        course.is_public = True
        db.commit()
    
    return {
        "share_token": course.share_token,
        "share_url": f"/shared/course/{course.share_token}"
    }


@router.get("/share/{share_token}", response_model=CourseDetailResponse)
async def access_shared_course(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Access a course via share token."""
    course = db.query(Course).filter(Course.share_token == share_token).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared course not found"
        )
    
    videos = db.query(Video).filter(Video.course_id == course.id).order_by(Video.position).all()
    
    response = CourseDetailResponse.from_orm(course)
    response.videos = [VideoResponse.from_orm(video) for video in videos]
    
    return response
