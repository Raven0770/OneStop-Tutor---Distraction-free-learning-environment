import { useState, useEffect } from 'react'
import { timestampAPI } from '../api/client'

export default function NotesPanel({ videoId, videoTitle }) {
  const [notes, setNotes] = useState('')
  const [timestamps, setTimestamps] = useState([])
  const [manualTime, setManualTime] = useState('0:00:00')
  const [savedMessage, setSavedMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTime, setEditingTime] = useState('')
  const [editingNote, setEditingNote] = useState('')
  const [showMultiAdd, setShowMultiAdd] = useState(false)
  const [multiTimestamps, setMultiTimestamps] = useState('')

  // Load timestamps on mount
  useEffect(() => {
    fetchTimestamps()
  }, [videoId])

  const fetchTimestamps = async () => {
    try {
      const response = await timestampAPI.getVideoTimestamps(videoId)
      setTimestamps(response.data || [])
    } catch (error) {
      console.error('Failed to fetch timestamps:', error)
    }
  }

  // Convert HH:MM:SS to seconds
  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':')
    const hours = parseInt(parts[0]) || 0
    const minutes = parseInt(parts[1]) || 0
    const seconds = parseInt(parts[2]) || 0
    return hours * 3600 + minutes * 60 + seconds
  }

  // Convert seconds to HH:MM:SS format
  const secondsToTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleSaveTimestamp = async () => {
    if (!manualTime.trim()) {
      alert('Please enter a time (HH:MM:SS format)')
      return
    }

    setLoading(true)
    try {
      const timeInSeconds = timeToSeconds(manualTime)
      const label = secondsToTime(timeInSeconds)

      const response = await timestampAPI.createTimestamp({
        video_id: videoId,
        time_seconds: timeInSeconds,
        label: label,
        note: notes || `Timestamp at ${label}`,
      })

      setTimestamps([...timestamps, response.data].sort((a, b) => a.time_seconds - b.time_seconds))
      setSavedMessage('✓ Timestamp saved!')
      setTimeout(() => setSavedMessage(''), 2000)
      setNotes('')
      setManualTime('0:00:00')
    } catch (error) {
      console.error('Failed to save timestamp:', error)
      alert('Failed to save timestamp')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMultipleTimestamps = async () => {
    if (!multiTimestamps.trim()) {
      alert('Please enter timestamps')
      return
    }

    setLoading(true)
    try {
      const lines = multiTimestamps.split('\n').filter(line => line.trim())
      let saved = 0

      for (const line of lines) {
        const [time, note] = line.split('|').map(s => s.trim())
        
        if (!time) continue

        try {
          const timeInSeconds = timeToSeconds(time)
          const label = secondsToTime(timeInSeconds)

          const response = await timestampAPI.createTimestamp({
            video_id: videoId,
            time_seconds: timeInSeconds,
            label: label,
            note: note || `Timestamp at ${label}`,
          })

          setTimestamps(prev => [...prev, response.data].sort((a, b) => a.time_seconds - b.time_seconds))
          saved++
        } catch (err) {
          console.error(`Failed to save timestamp from line: ${line}`, err)
        }
      }

      setSavedMessage(`✓ ${saved} timestamp(s) saved!`)
      setTimeout(() => setSavedMessage(''), 2000)
      setMultiTimestamps('')
      setShowMultiAdd(false)
    } catch (error) {
      console.error('Failed to save multiple timestamps:', error)
      alert('Failed to save timestamps')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTimestamp = async (id) => {
    if (!window.confirm('Delete this timestamp?')) return

    try {
      await timestampAPI.deleteTimestamp(id)
      setTimestamps(timestamps.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Failed to delete timestamp:', error)
      alert('Failed to delete timestamp')
    }
  }

  const handleEditTimestamp = (timestamp) => {
    setEditingId(timestamp.id)
    setEditingTime(timestamp.label)
    setEditingNote(timestamp.note || '')
  }

  const handleSaveEdit = async (id) => {
    if (!editingTime.trim()) {
      alert('Please enter a time')
      return
    }

    try {
      const timeInSeconds = timeToSeconds(editingTime)
      const label = secondsToTime(timeInSeconds)

      const response = await timestampAPI.updateTimestamp(id, {
        time_seconds: timeInSeconds,
        label: label,
        note: editingNote,
      })

      setTimestamps(timestamps.map((t) => (t.id === id ? response.data : t)).sort((a, b) => a.time_seconds - b.time_seconds))
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update timestamp:', error)
      alert('Failed to update timestamp')
    }
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Notes Section */}
        <div className="mb-4 pb-4 border-b border-gray-700">
          <label className="block text-sm font-semibold text-white mb-2">📝 Notes</label>
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
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-white">⏱️ Timestamps</label>
            <button
              onClick={() => setShowMultiAdd(!showMultiAdd)}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {showMultiAdd ? '➖ Single' : '➕ Multiple'}
            </button>
          </div>

          {!showMultiAdd ? (
            <>
              {/* Single Time Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-300 mb-1">Enter Time (HH:MM:SS)</label>
                <input
                  type="text"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder="0:00:00"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Example: 0:01:30, 0:05:45, 1:10:20</p>
              </div>

              {/* Timestamp Note Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-300 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note for this timestamp..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveTimestamp}
                disabled={loading}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition font-medium mb-3 disabled:opacity-50"
              >
                ⏱️ Save Timestamp
              </button>
            </>
          ) : (
            <>
              {/* Multiple Timestamps Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-300 mb-1">Enter Multiple (One per line)</label>
                <textarea
                  value={multiTimestamps}
                  onChange={(e) => setMultiTimestamps(e.target.value)}
                  placeholder="0:01:30 | Key concept&#10;0:05:45 | Important example&#10;0:10:20 | Summary"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-20"
                />
                <p className="text-xs text-gray-400 mt-1">Format: HH:MM:SS | Note</p>
              </div>

              <button
                onClick={handleSaveMultipleTimestamps}
                disabled={loading}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition font-medium mb-3 disabled:opacity-50"
              >
                ➕ Save All
              </button>
            </>
          )}

          {savedMessage && (
            <div className="text-green-400 text-sm text-center mb-2">{savedMessage}</div>
          )}

          {/* Timestamps List */}
          <div className="flex-1 overflow-y-auto">
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Saved ({timestamps.length})
            </label>
            {timestamps.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No timestamps saved yet
              </div>
            ) : (
              <div className="space-y-2">
                {timestamps.map((timestamp) => (
                  <div key={timestamp.id}>
                    {editingId === timestamp.id ? (
                      <div className="bg-gray-700 rounded p-2 text-xs border border-gray-600 space-y-2">
                        <input
                          type="text"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          placeholder="HH:MM:SS"
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          placeholder="Note..."
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveEdit(timestamp.id)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-700 rounded p-2 text-xs border border-gray-600">
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
                              onClick={() => handleEditTimestamp(timestamp)}
                              className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-xs"
                            >
                              ✏️
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
                    )}
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
