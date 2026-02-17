from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# User Schemas
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Video Schemas
class VideoBase(BaseModel):
    youtube_url: str
    title: Optional[str] = None
    description: Optional[str] = None


class VideoCreate(VideoBase):
    pass


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None


class VideoResponse(VideoBase):
    id: int
    youtube_video_id: str
    position: int
    duration: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Video Progress Schemas
class VideoProgressBase(BaseModel):
    last_timestamp: int = 0
    completed: bool = False


class VideoProgressUpdate(BaseModel):
    last_timestamp: Optional[int] = None
    completed: Optional[bool] = None


class VideoProgressResponse(VideoProgressBase):
    id: int
    user_id: int
    video_id: int
    course_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = False


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    user_id: int
    created_at: datetime
    share_token: Optional[str] = None

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseResponse):
    videos: List[VideoResponse] = []


# AI Assistant Schemas
class AIAssistantRequest(BaseModel):
    video_id: int
    question: str
    context: Optional[str] = None
    request_type: str  # "question", "summary", "explain", "quiz", "notes"


class AIAssistantResponse(BaseModel):
    response: str
    type: str


# Pomodoro Schemas
class PomodoroSessionCreate(BaseModel):
    duration: int  # in seconds


class PomodoroSessionResponse(BaseModel):
    id: int
    user_id: int
    duration: int
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
