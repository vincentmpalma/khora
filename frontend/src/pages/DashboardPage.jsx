import { useNavigate } from 'react-router-dom'
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

  function handleSignOut() {
    localStorage.removeItem('token')
    navigate('/')
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
          <button className="btn-primary">+ New Room</button>
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
                  <span className="room-date">Created {room.createdAt}</span>
                </div>
                <span className="room-open">Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
