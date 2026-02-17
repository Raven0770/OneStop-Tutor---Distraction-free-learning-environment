import os
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()


class AIAssistant:
    """AI Assistant service using Claude API."""

    def __init__(self):
        self.api_key = os.getenv("CLAUDE_API_KEY", "")
        self.base_url = "https://api.anthropic.com/v1"

    async def answer_question(self, question: str, context: Optional[str] = None) -> str:
        """Answer user questions about video content."""
        prompt = f"""
        A user is asking about video content they're watching.
        
        Video Context: {context or "No specific context provided"}
        
        User Question: {question}
        
        Please provide a clear, concise answer that helps them understand the concept better.
        """
        
        return await self._call_claude(prompt)

    async def generate_summary(self, video_title: str, context: Optional[str] = None) -> str:
        """Generate a concise summary of video content."""
        prompt = f"""
        Create a concise summary of a video with the following details:
        
        Video Title: {video_title}
        Context/Description: {context or "No additional context provided"}
        
        The summary should be 3-5 bullet points covering the main topics.
        """
        
        return await self._call_claude(prompt)

    async def explain_concept(self, concept: str, level: str = "beginner") -> str:
        """Explain a concept in beginner-friendly language."""
        prompt = f"""
        Explain the following concept in {level}-friendly language:
        
        Concept: {concept}
        
        The explanation should be clear, use examples, and avoid heavy jargon.
        """
        
        return await self._call_claude(prompt)

    async def generate_quiz(self, topic: str, num_questions: int = 3) -> str:
        """Generate a short quiz for learning reinforcement."""
        prompt = f"""
        Create {num_questions} quiz questions about this topic for learning reinforcement:
        
        Topic: {topic}
        
        Format each question with:
        - Question number
        - The question
        - Multiple choice options (A, B, C, D)
        - Correct answer
        
        Make questions progressively harder.
        """
        
        return await self._call_claude(prompt)

    async def assist_note_taking(self, video_title: str, notes: str) -> str:
        """Assist in organizing and improving notes."""
        prompt = f"""
        Help organize and improve these study notes:
        
        Video Title: {video_title}
        Current Notes: {notes}
        
        Please:
        1. Reorganize for clarity
        2. Add any missing key points
        3. Suggest memory aids or mnemonics if helpful
        4. Format as a clear outline
        """
        
        return await self._call_claude(prompt)

    async def _call_claude(self, prompt: str) -> str:
        """Call Claude API."""
        if not self.api_key:
            return "Error: CLAUDE_API_KEY not configured. Please set it in environment variables or contact administrator."
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 1024,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "content" in data and len(data["content"]) > 0:
                        return data["content"][0]["text"]
                    return "No response from Claude API"
                else:
                    return f"Claude API error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error calling Claude API: {str(e)}"


# Initialize AI assistant
ai_assistant = AIAssistant()


