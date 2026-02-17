from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import AIAssistantRequest, AIAssistantResponse
from auth import get_current_user
from ai_service import ai_assistant
from models import Video, VideoProgress

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/assistant", response_model=AIAssistantResponse)
async def get_ai_assistance(
    request: AIAssistantRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI assistance for video learning using Claude API."""
    # Verify video exists
    video = db.query(Video).filter(Video.id == request.video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get appropriate response based on request type
    request_type = request.request_type.lower()
    
    try:
        if request_type == "question":
            response = await ai_assistant.answer_question(
                request.question,
                request.context or video.title
            )
        elif request_type == "summary":
            response = await ai_assistant.generate_summary(
                video.title,
                request.context or video.description
            )
        elif request_type == "explain":
            response = await ai_assistant.explain_concept(
                request.question,
                level="beginner"
            )
        elif request_type == "quiz":
            response = await ai_assistant.generate_quiz(
                request.question,
                num_questions=3
            )
        elif request_type == "notes":
            response = await ai_assistant.assist_note_taking(
                video.title,
                request.question
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown request type: {request_type}"
            )
        
        return AIAssistantResponse(
            response=response,
            type=request_type
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )


@router.post("/ask-about-video")
async def ask_about_video(
    video_id: int,
    question: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick endpoint to ask questions about a video."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    response = await ai_assistant.answer_question(question, video.title)
    
    return {
        "video_id": video_id,
        "question": question,
        "answer": response
    }


@router.post("/summarize/{video_id}")
async def summarize_video(
    video_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI summary of video content using Claude."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    summary = await ai_assistant.generate_summary(video.title, video.description)
    
    return {
        "video_id": video_id,
        "title": video.title,
        "summary": summary
    }
