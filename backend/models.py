from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("Course", back_populates="owner")
    video_progress = relationship("VideoProgress", back_populates="user")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    share_token = Column(String, unique=True, nullable=True, index=True)

    owner = relationship("User", back_populates="courses")
    videos = relationship("Video", back_populates="course", cascade="all, delete-orphan")
    video_progress = relationship("VideoProgress", back_populates="course")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    youtube_url = Column(String)
    youtube_video_id = Column(String, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    position = Column(Integer)  # Order in course
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="videos")
    progress = relationship("VideoProgress", back_populates="video")
    timestamps = relationship("Timestamp", back_populates="video", cascade="all, delete-orphan")


class VideoProgress(Base):
    __tablename__ = "video_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    last_timestamp = Column(Integer, default=0)  # in seconds
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="video_progress")
    video = relationship("Video", back_populates="progress")
    course = relationship("Course", back_populates="video_progress")


class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    duration = Column(Integer)  # in seconds
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pomodoro_sessions")


class Timestamp(Base):
    __tablename__ = "timestamps"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    time_seconds = Column(Float)
    label = Column(String)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = relationship("Video", back_populates="timestamps")
    user = relationship("User")
