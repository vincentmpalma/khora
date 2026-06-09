import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <nav className="nav">
        <span className="nav-logo">Khora</span>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <h1 className="hero-title">
          Design systems architecture<br />
          <span className="hero-accent">together, in real time.</span>
        </h1>
        <p className="hero-subtitle">
          A collaborative infinite canvas for software engineers. Drag components,
          connect services, and build architecture diagrams with your team — live.
        </p>
        <div className="hero-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Get Started Free</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </section>

      <section className="canvas-section">
        <div className="canvas-label">Try it — no account needed</div>
        <div className="canvas-placeholder">
          <span className="canvas-placeholder-text">Canvas coming soon</span>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
