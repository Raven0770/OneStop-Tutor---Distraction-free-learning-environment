import { useState, useEffect } from 'react'
import { progressAPI } from '../api/client'

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [tempWorkDuration, setTempWorkDuration] = useState(25)
  const [tempBreakDuration, setTempBreakDuration] = useState(5)

  useEffect(() => {
    let interval
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      if (isBreak) {
        setIsBreak(false)
        setTimeLeft(workDuration * 60)
        playNotification()
      } else {
        completeSession()
        setIsBreak(true)
        setTimeLeft(breakDuration * 60)
        playNotification()
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, isBreak, workDuration, breakDuration])

  const playNotification = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.log('Could not play notification sound')
    }
  }

  const handleStart = async () => {
    if (!sessionId && !isBreak) {
      try {
        const response = await progressAPI.startPomodoroSession(workDuration * 60)
        setSessionId(response.data.id)
      } catch (error) {
        console.error('Failed to start session:', error)
        return
      }
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setTimeLeft(workDuration * 60)
    setSessionId(null)
  }

  const handleSaveSettings = () => {
    if (tempWorkDuration < 1 || tempBreakDuration < 1) {
      alert('Duration must be at least 1 minute')
      return
    }
    setWorkDuration(tempWorkDuration)
    setBreakDuration(tempBreakDuration)
    setTimeLeft(tempWorkDuration * 60)
    setShowSettings(false)
    setIsRunning(false)
    setIsBreak(false)
    setSessionId(null)
  }

  const completeSession = async () => {
    setIsRunning(false)
    if (sessionId) {
      try {
        await progressAPI.completePomodoroSession(sessionId)
      } catch (error) {
        console.error('Failed to complete session:', error)
      }
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div>
      {/* Settings Panel */}
      {showSettings && (
        <div className="space-y-2 mb-3 pb-3 border-b border-gray-600">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Work (min)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={tempWorkDuration}
              onChange={(e) => setTempWorkDuration(parseInt(e.target.value))}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Break (min)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={tempBreakDuration}
              onChange={(e) => setTempBreakDuration(parseInt(e.target.value))}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="w-full px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition"
          >
            Save
          </button>
        </div>
      )}

      {/* Timer Display - Compact */}
      <div className="text-center mb-3">
        <div className="text-4xl font-bold font-mono mb-1"
          style={{ color: isBreak ? '#4ade80' : '#818cf8' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <p className="text-gray-400 text-xs">
          {isBreak ? `Break (${breakDuration}m)` : `Work (${workDuration}m)`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-600 rounded-full h-1 mb-3 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${isBreak 
              ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
              : ((workDuration * 60 - timeLeft) / (workDuration * 60)) * 100
            }%`,
            backgroundColor: isBreak ? '#4ade80' : '#818cf8',
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition font-medium"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition font-medium"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition font-medium"
        >
          Reset
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 transition"
        >
          ⚙️
        </button>
      </div>

      {/* Quick Tips */}
      <div className="text-xs text-gray-400 text-center">
        <p>Focus for {workDuration}min, break for {breakDuration}min</p>
      </div>
    </div>
  )
}
