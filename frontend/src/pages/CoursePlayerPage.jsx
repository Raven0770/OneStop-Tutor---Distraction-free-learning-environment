import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { courseAPI, videoAPI, progressAPI } from '../api/client'
import PomodoroTimer from '../components/PomodoroTimer'
import SimpleNotesPanel from '../components/SimpleNotesPanel'

export default function CoursePlayerPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddVideoModal, setShowAddVideoModal] = useState(false)
  const [youtubeUrls, setYoutubeUrls] = useState('')
  const [addingVideos, setAddingVideos] = useState(false)
  const [draggedVideo, setDraggedVideo] = useState(null)
  const [videoCompletion, setVideoCompletion] = useState({})
  const [savingProgress, setSavingProgress] = useState(false)
  const [showVideoList, setShowVideoList] = useState(true)
  const [showPomodoro, setShowPomodoro] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  // Auto-save progress every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (course?.videos[currentVideoIndex]) {
        saveVideoProgress()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [course, currentVideoIndex])

  const fetchCourse = async () => {
    try {
      const response = await courseAPI.getCourseDetail(courseId)
      setCourse(response.data)
      setLoading(false)
      fetchVideoCompletion()
    } catch (error) {
      console.error('Failed to fetch course:', error)
      navigate('/dashboard')
    }
  }

  const fetchVideoCompletion = async () => {
    try {
      const response = await progressAPI.getCourseProgress(courseId)
      const completionMap = {}
      response.data.progress.forEach((prog) => {
        completionMap[prog.video_id] = prog.completed || false
      })
      setVideoCompletion(completionMap)
    } catch (error) {
      console.error('Failed to fetch completion:', error)
    }
  }

  const saveVideoProgress = async () => {
    if (!savingProgress && currentVideoIndex < course?.videos.length) {
      setSavingProgress(true)
      try {
        const videoId = course.videos[currentVideoIndex].id
        await progressAPI.updateVideoProgress(videoId, {
          last_timestamp: 0,
          completed: videoCompletion[videoId] || false,
        })
      } catch (error) {
        console.error('Failed to save progress:', error)
      } finally {
        setSavingProgress(false)
      }
    }
  }

  const handleToggleCompletion = async (videoId) => {
    const newStatus = !videoCompletion[videoId]
    setVideoCompletion({
      ...videoCompletion,
      [videoId]: newStatus,
    })

    try {
      await progressAPI.updateVideoProgress(videoId, {
        last_timestamp: 0,
        completed: newStatus,
      })
    } catch (error) {
      console.error('Failed to update completion:', error)
    }
  }

  const handleAddMultipleVideos = async (e) => {
    e.preventDefault()
    setAddingVideos(true)
    
    const urls = youtubeUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      alert('Please enter at least one YouTube URL')
      setAddingVideos(false)
      return
    }

    for (const url of urls) {
      try {
        const response = await videoAPI.addVideo(courseId, {
          youtube_url: url,
        })
        setCourse({
          ...course,
          videos: [...course.videos, response.data],
        })
      } catch (error) {
        console.error('Failed to add video:', error)
      }
    }

    setYoutubeUrls('')
    setShowAddVideoModal(false)
    setAddingVideos(false)
  }

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Remove this video from the course?')) {
      try {
        await videoAPI.deleteVideo(videoId)
        setCourse({
          ...course,
          videos: course.videos.filter(v => v.id !== videoId),
        })
        if (currentVideoIndex >= course.videos.length - 1) {
          setCurrentVideoIndex(Math.max(0, course.videos.length - 2))
        }
      } catch (error) {
        console.error('Failed to delete video:', error)
      }
    }
  }

  const handleDragStart = (e, index) => {
    setDraggedVideo(index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault()
    if (draggedVideo === null || draggedVideo === targetIndex) return

    const newVideos = [...course.videos]
    const draggedItem = newVideos[draggedVideo]
    newVideos.splice(draggedVideo, 1)
    newVideos.splice(targetIndex, 0, draggedItem)

    for (let i = 0; i < newVideos.length; i++) {
      try {
        await videoAPI.reorderVideo(newVideos[i].id, i)
      } catch (error) {
        console.error('Failed to reorder video:', error)
      }
    }

    setCourse({ ...course, videos: newVideos })
    setDraggedVideo(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>
  }

  const currentVideo = course?.videos[currentVideoIndex]
  const currentVideoEmbed = `https://www.youtube.com/embed/${currentVideo?.youtube_video_id}`

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          <p className="text-gray-400 text-sm">{course.videos.length} videos</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          ← Back
        </button>
      </div>

      {/* Main Layout: Video + Notes */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel: Video List (Minimizable) */}
        <div className={`${showVideoList ? 'w-72' : 'w-16'} bg-gray-800 rounded-lg border border-gray-700 flex flex-col transition-all`}>
          <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800 flex justify-between items-center">
            {showVideoList && (
              <button
                onClick={() => setShowAddVideoModal(true)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
              >
                + Add Videos
              </button>
            )}
            <button
              onClick={() => setShowVideoList(!showVideoList)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition ml-2"
              title={showVideoList ? "Minimize" : "Expand"}
            >
              {showVideoList ? '◀' : '▶'}
            </button>
          </div>

          {showVideoList && (
            <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              {course?.videos.map((video, index) => {
                const isCompleted = videoCompletion[video.id]
                
                return (
                  <div
                    key={video.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-3 rounded-lg cursor-move transition flex items-start gap-2 ${
                      index === currentVideoIndex
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${draggedVideo === index ? 'opacity-50' : ''}`}
                  >
                    <span className="text-xs text-gray-400 mt-1">⋮⋮</span>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setCurrentVideoIndex(index)}
                    >
                      <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                      <p className="text-xs mt-1 opacity-75">Part {index + 1}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleCompletion(video.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 mt-1 cursor-pointer"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Center Panel: Video Player (60% width) */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            {currentVideo ? (
              <iframe
                width="100%"
                height="100%"
                src={currentVideoEmbed}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No video selected
              </div>
            )}
          </div>

          {/* Video Title */}
          {currentVideo && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-lg font-bold text-white">{currentVideo.title}</h2>
              <p className="text-xs text-gray-400 mt-1">Part {currentVideoIndex + 1} of {course.videos.length}</p>
            </div>
          )}

          {/* Video Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
              disabled={currentVideoIndex === 0}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => handleDeleteVideo(currentVideo?.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Remove
            </button>
            <button
              onClick={() =>
                setCurrentVideoIndex(Math.min(course.videos.length - 1, currentVideoIndex + 1))
              }
              disabled={currentVideoIndex === course.videos.length - 1}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right Panel: Notes (40% width) */}
        <div className="w-2/5 flex flex-col gap-4">
          {currentVideo && (
            <>
              <SimpleNotesPanel videoId={currentVideo.id} videoTitle={currentVideo.title} />
              
              {/* Minimizable Pomodoro */}
              {showPomodoro && (
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">🍅 Pomodoro</h3>
                    <button
                      onClick={() => setShowPomodoro(false)}
                      className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4">
                    <PomodoroTimer />
                  </div>
                </div>
              )}
              
              {!showPomodoro && (
                <button
                  onClick={() => setShowPomodoro(true)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                >
                  🍅 Show Pomodoro
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Multiple Videos Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">Add Videos to Course</h3>
            <form onSubmit={handleAddMultipleVideos} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube URLs (one per line)
                </label>
                <textarea
                  value={youtubeUrls}
                  onChange={(e) => setYoutubeUrls(e.target.value)}
                  placeholder={`https://www.youtube.com/watch?v=...
https://youtu.be/...
https://www.youtube.com/watch?v=...`}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="6"
                  required
                />
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded p-3">
                <p className="text-blue-200 text-xs">
                  💡 <strong>Tip:</strong> Paste multiple YouTube URLs, one per line.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addingVideos}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                >
                  {addingVideos ? 'Adding...' : 'Add All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
