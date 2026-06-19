import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './DashboardPage.css'

const fakeRooms = [
  { id: 1, name: 'Twitter Architecture', slug: 'twitter-arch', createdAt: 'Jun 1, 2026' },
  { id: 2, name: 'E-Commerce Checkout', slug: 'ecommerce-checkout', createdAt: 'Jun 3, 2026' },
  { id: 3, name: 'Chat App Design', slug: 'chat-app', createdAt: 'Jun 5, 2026' },
]

function MiniPreview() {
  return (
    <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg" className="room-preview-svg" aria-hidden="true">
      <rect x="20" y="38" width="70" height="36" rx="6" fill="#1c1c1e" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="105" y="38" width="70" height="36" rx="6" fill="#1c1c1e" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="190" y="38" width="70" height="36" rx="6" fill="rgba(10,132,255,0.08)" stroke="rgba(10,132,255,0.3)" strokeWidth="1" />
      <line x1="90" y1="56" x2="105" y2="56" stroke="#2a2a2e" strokeWidth="1.5" />
      <line x1="175" y1="56" x2="190" y2="56" stroke="#2a2a2e" strokeWidth="1.5" />
    </svg>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [rooms, setRooms] = useState([])

  useEffect(() => {

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    async function fetchRooms() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (response.ok) {
          setRooms(data.rooms)
        } else {
          console.error(data.error)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchRooms()

  }, [])

  function handleSignOut() {
    localStorage.removeItem('token')
    navigate('/')
  }

  async function handleCreateRoom() {
    if (!roomName.trim()) return

    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: roomName })
      })

      const data = await response.json()
      if (!response.ok) return

      setShowModal(false)
      setRoomName('')
      navigate(`/room/${data.room.slug}`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <span className="nav-logo">Khora</span>
        <button className="btn-ghost" onClick={handleSignOut}>Sign Out</button>
      </nav>

      <div className="dash-content">
        <div className="dash-header">
          <div className="dash-header-text">
            <h1>Your rooms</h1>
            <p>Continue a session or start a new architecture canvas.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Room</button>
        </div>

        <div className="rooms-grid">
          {fakeRooms.map(room => (
            <div key={room.id} className="room-card" onClick={() => navigate(`/room/${room.slug}`)}>
              <div className="room-preview">
                <MiniPreview />
              </div>
              <div className="room-card-info">
                <div className="room-meta">
                  <span className="room-name">{room.name}</span>
                  <span className="room-date">Created {room.created_at || room.createdAt}</span>
                </div>
                <span className="room-open">Open →</span>
              </div>
            </div>
          ))}

          {rooms.map(room => (
            <div key={room.id} className="room-card" onClick={() => navigate(`/room/${room.slug}`)}>
              <div className="room-preview">
                <MiniPreview />
              </div>
              <div className="room-card-info">
                <div className="room-meta">
                  <span className="room-name">{room.name}</span>
                  <span className="room-date">Created {new Date(room.created_at).toLocaleDateString()}</span>
                </div>
                <span className="room-open">Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">New room</p>
            <div className="form-group">
              <label htmlFor="room-name">Room name</label>
              <input
                id="room-name"
                type="text"
                placeholder="e.g. Twitter Architecture"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateRoom}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
