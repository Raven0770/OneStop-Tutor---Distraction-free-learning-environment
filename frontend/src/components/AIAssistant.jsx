import { useState, useEffect } from 'react'
import { progressAPI } from '../api/client'

export default function NotesPanel({ videoId, videoTitle }) {
  const [notes, setNotes] = useState('')
  const [timestamps, setTimestamps] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  // Load notes and timestamps on mount
  useEffect(() => {
    fetchTimestamps()
  }, [videoId])

  const fetchTimestamps = async () => {
    try {
      const response = await progressAPI.getCourseProgress(videoId)
      // In a real app, you'd fetch timestamps from the API
      // For now, we'll use localStorage
      const saved = localStorage.getItem(`timestamps-${videoId}`)
      if (saved) {
        setTimestamps(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to fetch timestamps:', error)
    }
  }

  const handleSaveTimestamp = async () => {
    const timestamp = {
      id: Date.now(),
      time: currentTime,
      label: `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`,
      note: notes || `Timestamp at ${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
    }

    const updatedTimestamps = [...timestamps, timestamp]
    setTimestamps(updatedTimestamps)
    localStorage.setItem(`timestamps-${videoId}`, JSON.stringify(updatedTimestamps))

    setSavedMessage('✓ Timestamp saved!')
    setTimeout(() => setSavedMessage(''), 2000)
    setNotes('')
  }

  const handleDeleteTimestamp = (id) => {
    const updated = timestamps.filter((t) => t.id !== id)
    setTimestamps(updated)
    localStorage.setItem(`timestamps-${videoId}`, JSON.stringify(updated))
  }

  const handleDownloadNotes = () => {
    const content = notes || 'No notes yet'
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `notes-${videoId}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notes)
    alert('Notes copied to clipboard!')
  }

  const handleCopyTimestamp = (timestamp) => {
    navigator.clipboard.writeText(`[${timestamp.label}] ${timestamp.note}`)
    alert('Timestamp copied to clipboard!')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
        <h3 className="text-lg font-bold text-white">Notes & Timestamps</h3>
        <p className="text-xs text-gray-400 mt-1">{videoTitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button className="flex-1 px-4 py-2 text-xs font-medium text-indigo-400 border-b-2 border-indigo-400">
          📝 Notes & Timestamps
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Notes Section */}
        <div className="mb-4 pb-4 border-b border-gray-700">
          <label className="block text-sm font-semibold text-white mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-20"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDownloadNotes}
              disabled={!notes.trim()}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition disabled:opacity-50 font-medium"
            >
              ⬇️ Download
            </button>
            <button
              onClick={handleCopyNotes}
              disabled={!notes.trim()}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Timestamp Section */}
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-semibold text-white mb-2">Save Timestamp</label>
          <button
            onClick={handleSaveTimestamp}
            className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition font-medium mb-3"
          >
            ⏱️ Save Current Timestamp
          </button>

          {savedMessage && (
            <div className="text-green-400 text-sm text-center mb-2">{savedMessage}</div>
          )}

          {/* Timestamps List */}
          <div className="flex-1 overflow-y-auto">
            <label className="block text-xs font-semibold text-gray-300 mb-2">Saved Timestamps ({timestamps.length})</label>
            {timestamps.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No timestamps saved yet
              </div>
            ) : (
              <div className="space-y-2">
                {timestamps.map((timestamp) => (
                  <div
                    key={timestamp.id}
                    className="bg-gray-700 rounded p-2 text-xs border border-gray-600"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-mono text-indigo-400 font-semibold">{timestamp.label}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopyTimestamp(timestamp)}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDeleteTimestamp(timestamp.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 line-clamp-2">{timestamp.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

