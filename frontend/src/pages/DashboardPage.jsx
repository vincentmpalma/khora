import { useNavigate } from 'react-router-dom'
import './DashboardPage.css'

const fakeRooms = [
  { id: 1, name: 'Twitter Architecture', slug: 'twitter-arch', createdAt: 'Jun 1, 2026' },
  { id: 2, name: 'E-Commerce Checkout', slug: 'ecommerce-checkout', createdAt: 'Jun 3, 2026' },
  { id: 3, name: 'Chat App Design', slug: 'chat-app', createdAt: 'Jun 5, 2026' },
]

function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <span className="nav-logo">Khora</span>
        <button className="btn-ghost">Sign Out</button>
      </nav>

      <div className="dash-content">
        <div className="dash-header">
          <h1>Your Rooms</h1>
          <button className="btn-primary">+ New Room</button>
        </div>

        <div className="rooms-grid">
          {fakeRooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-body">
                <h2 className="room-name">{room.name}</h2>
                <p className="room-date">Created {room.createdAt}</p>
              </div>
              <div className="room-card-footer">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/room/${room.slug}`)}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
