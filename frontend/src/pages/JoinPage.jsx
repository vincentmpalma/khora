import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import './JoinPage.css'

function JoinPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [guestMode, setGuestMode] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [roomSlug, setRoomSlug] = useState('')
  const [roomName, setRoomName] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) {
      joinAuthenticated()
    } else {
      fetchRoomForGuest()
    }
  }, [token])

  async function joinAuthenticated() {
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/join/${token}`)
      if (!res) return
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'invalid invite link'); return }
      navigate(`/room/${data.slug}`, { replace: true })
    } catch {
      setError('something went wrong')
    }
  }

  async function fetchRoomForGuest() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/guest-join/${token}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'invalid invite link'); return }
      setRoomSlug(data.slug)
      setRoomName(data.name)
      setGuestMode(true)
    } catch {
      setError('something went wrong')
    }
  }

  function handleGuestJoin(e) {
    e.preventDefault()
    const name = guestName.trim()
    if (!name || joining) return
    setJoining(true)
    sessionStorage.setItem('guestSession', JSON.stringify({ guestName: name, roomSlug, roomName }))
    navigate(`/room/${roomSlug}`, { replace: true })
  }

  if (error) {
    return (
      <div className="join-page">
        <div className="join-card">
          <p className="join-error">{error}</p>
          <button className="join-text-btn" onClick={() => navigate('/')}>Go to home</button>
        </div>
      </div>
    )
  }

  if (guestMode) {
    return (
      <div className="join-page">
        <div className="join-card">
          <p className="join-room-label">{roomName}</p>
          <h2 className="join-title">Join as guest</h2>
          <p className="join-subtitle">Choose a name others in the room will see on your cursor.</p>
          <form onSubmit={handleGuestJoin} className="join-form">
            <input
              className="join-input"
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              maxLength={32}
              autoFocus
            />
            <button type="submit" className="join-btn" disabled={!guestName.trim() || joining}>
              {joining ? 'Joining…' : 'Join room'}
            </button>
          </form>
          <p className="join-hint">
            Have an account?{' '}
            <button className="join-text-btn" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="join-page">
      <p className="join-loading">Joining room…</p>
    </div>
  )
}

export default JoinPage
