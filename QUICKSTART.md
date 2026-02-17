# OneStop Tutor - Quick Start Guide

## Option 1: Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd onestop-tutor

# Create .env with configuration
cp backend/.env.example backend/.env

# Update CLAUDE_API_KEY in backend/.env

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Option 2: Manual Setup

### Start Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database and API keys

# Run server
python main.py
# Server at http://localhost:8000
```

### Start Frontend (in another terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend at http://localhost:5173
```

## First Steps After Setup

1. **Register Account**
   - Go to http://localhost:5173/register
   - Create new account with email and password

2. **Create Course**
   - Click "Create Course" on dashboard
   - Enter course title and description

3. **Add Videos**
   - Click "Open" to enter course
   - Click "+ Add Video"
   - Paste YouTube URL (works with youtube.com, youtu.be)

4. **Start Learning**
   - Videos appear in left panel
   - Watch in center
   - Use AI Assistant and Pomodoro on right

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check port 8000 is available
- Run: `python -c "from models import Base; from database import engine; Base.metadata.create_all(bind=engine)"`

### Frontend won't connect to backend
- Check VITE_API_URL in frontend/.env or vite.config.js
- Ensure backend server is running on port 8000
- Check browser console for CORS errors

### Database errors
- Ensure PostgreSQL is running
- Create database: `createdb onestop_tutor`
- Reset: `dropdb onestop_tutor && createdb onestop_tutor`

### Port conflicts
- Backend uses 8000 (change in main.py)
- Frontend uses 5173 (change in vite.config.js)
- PostgreSQL uses 5432

## Development Commands

### Backend
```bash
cd backend

# Run with auto-reload
python main.py

# View API docs
# Go to http://localhost:8000/docs

# Run tests (when added)
pytest

# Code formatting
black .

# Linting
flake8 .
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Key Features to Try

1. **Create Multiple Courses** - Organize by topic or skill
2. **Drag & Drop Reordering** - Rearrange videos in course
3. **AI Assistant** - Ask questions, get summaries, quizzes
4. **Pomodoro Timer** - 25-min focus sessions with breaks
5. **Progress Tracking** - Resume from where you left off
6. **Share Courses** - Generate share link and share with others
7. **Note Taking** - Write and improve notes with AI

## Example Workflow

```
1. Create course: "Web Development Basics"
2. Add videos:
   - "HTML Fundamentals" (https://youtube.com/watch?v=...)
   - "CSS Styling" (https://youtube.com/watch?v=...)
   - "JavaScript Intro" (https://youtube.com/watch?v=...)
3. Watch first video
4. Use AI Assistant to:
   - Ask questions about concepts
   - Get summary of video
   - Generate quiz questions
5. Use Pomodoro timer for 25-min focused sessions
6. Track progress as you complete videos
7. Share course with study group
```

## Getting Help

- Check API documentation: http://localhost:8000/docs
- Review backend routes in routes_*.py files
- Check console logs for errors
- See README.md for detailed information

---

Happy learning! 🎓
