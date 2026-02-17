# OneStop Tutor - AI-Powered Learning Journey Builder

A web-based learning platform that transforms YouTube videos into structured, distraction-free courses with AI-powered learning assistance.

## 🌟 Features

- **Multiple Course Management** - Create unlimited personalized courses
- **YouTube Integration** - Add YouTube videos in defined order with auto-metadata retrieval
- **Three-Panel Interface**
  - Left: Ordered video list with completion indicators
  - Center: Embedded YouTube player
  - Right: AI assistant and Pomodoro timer
- **Progress Tracking** - Resume from last watched timestamp, mark videos complete, track progress percentage
- **AI Learning Assistant**
  - Answer questions about video content
  - Generate concise summaries
  - Explain concepts in beginner-friendly language
  - Generate quizzes for reinforcement
  - Assist in note-taking
- **Built-in Pomodoro Timer** - 25/5 focus cycle with break reminders
- **Course Sharing** - Share curated courses via unique tokens
- **User Authentication** - Secure JWT-based authentication

## 🏗️ System Architecture

### Frontend
- **React** (Vite) - Modern UI framework
- **Tailwind CSS** - Responsive styling
- **Zustand** - State management
- **Axios** - API client
- **React Router** - Client-side routing

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **JWT Authentication** - Secure token-based auth
- **Claude API** - AI-powered learning assistance

## 📋 Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- pip and npm

## 🚀 Getting Started

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb onestop_tutor

# Update DATABASE_URL in backend/.env
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your configuration
# - DATABASE_URL
# - SECRET_KEY (generate random string)
# - CLAUDE_API_KEY (optional, for AI features)

# Initialize database
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"

# Run backend server
python main.py
# Server will be at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file if needed
# VITE_API_URL=http://localhost:8000

# Run development server
npm run dev
# Server will be at http://localhost:5173
```

## 📚 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user

### Courses
- `POST /api/courses/` - Create course
- `GET /api/courses/` - Get user's courses
- `GET /api/courses/{courseId}` - Get course details
- `PATCH /api/courses/{courseId}` - Update course
- `DELETE /api/courses/{courseId}` - Delete course
- `GET /api/courses/{courseId}/progress` - Get progress
- `POST /api/courses/{courseId}/share` - Share course
- `GET /api/courses/share/{shareToken}` - Access shared course

### Videos
- `POST /api/videos/{courseId}/add` - Add video to course
- `GET /api/videos/course/{courseId}/list` - List course videos
- `PATCH /api/videos/{videoId}` - Update video
- `DELETE /api/videos/{videoId}` - Delete video
- `POST /api/videos/{videoId}/reorder` - Reorder video

### Progress
- `POST /api/progress/video/{videoId}` - Update video progress
- `GET /api/progress/video/{videoId}` - Get video progress
- `GET /api/progress/course/{courseId}` - Get course progress
- `POST /api/progress/pomodoro/start` - Start Pomodoro session
- `PATCH /api/progress/pomodoro/{sessionId}` - Complete session
- `GET /api/progress/pomodoro/stats` - Get Pomodoro stats

### AI Assistant
- `POST /api/ai/assistant` - Get AI assistance (question, summary, explain, quiz, notes)
- `POST /api/ai/ask-about-video` - Ask about specific video
- `GET /api/ai/summarize/{videoId}` - Summarize video

## 🗄️ Database Schema

### Users
```sql
id | email | password_hash | created_at
```

### Courses
```sql
id | user_id | title | description | is_public | share_token | created_at
```

### Videos
```sql
id | course_id | youtube_url | youtube_video_id | title | description | duration | position | created_at
```

### VideoProgress
```sql
id | user_id | video_id | course_id | last_timestamp | completed | created_at | updated_at
```

### PomodoroSessions
```sql
id | user_id | duration | completed | created_at
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost/onestop_tutor
SECRET_KEY=your-super-secret-key-change-in-production
CLAUDE_API_KEY=your-claude-api-key-here
YOUTUBE_API_KEY=optional-youtube-api-key
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
```

## 📦 Project Structure

```
onestop-tutor/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── database.py             # Database configuration
│   ├── auth.py                 # JWT authentication
│   ├── youtube_utils.py        # YouTube integration
│   ├── ai_service.py           # AI/Claude integration
│   ├── routes_users.py         # User endpoints
│   ├── routes_courses.py       # Course endpoints
│   ├── routes_videos.py        # Video endpoints
│   ├── routes_progress.py      # Progress endpoints
│   ├── routes_ai.py            # AI endpoints
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment template
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   └── CoursePlayerPage.jsx
    │   ├── components/
    │   │   ├── PomodoroTimer.jsx
    │   │   ├── AIAssistant.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── store/
    │   │   ├── authStore.js
    │   │   └── courseStore.js
    │   ├── api/
    │   │   └── client.js
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🚢 Deployment

### Backend (FastAPI)
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Or use cloud platforms: Heroku, Railway, Render, AWS, GCP, Azure
```

### Frontend (React)
```bash
# Build production bundle
npm run build

# Deploy dist/ folder to: Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront
```

### Database
- PostgreSQL hosted on: AWS RDS, Heroku Postgres, Supabase, DigitalOcean

## 🔐 Security Considerations

- Change `SECRET_KEY` in production
- Use HTTPS in production
- Set appropriate CORS origins
- Implement rate limiting
- Validate all user inputs
- Use environment variables for sensitive data
- Keep dependencies updated

## 🎯 Future Enhancements

- YouTube playlist import
- Course cloning functionality
- Learning analytics dashboard
- Study streak visualization
- Transcript-based AI context
- Community course discovery
- Gamification and milestones
- Mobile app
- Offline mode
- Multi-language support

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please create an issue on GitHub or contact the development team.

---

**Happy Learning! 🎓**
