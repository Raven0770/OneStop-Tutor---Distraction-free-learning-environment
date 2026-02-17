import { useState } from 'react'

export default function SimpleNotesPanel({ videoId, videoTitle }) {
  const [notes, setNotes] = useState('')

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

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
        <h3 className="text-lg font-bold text-white">📝 Notes</h3>
        <p className="text-xs text-gray-400 mt-1">{videoTitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Notes Textarea */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here..."
          className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadNotes}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            ⬇️ Download
          </button>
          <button
            onClick={handleCopyNotes}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            📋 Copy
          </button>
        </div>
      </div>
    </div>
  )
}
