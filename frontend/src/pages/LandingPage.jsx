import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

function CanvasPreview() {
  return (
    <div className="preview-frame">
      <div className="preview-topbar">
        <div className="preview-dot" />
        <div className="preview-dot" />
        <div className="preview-dot" />
        <span className="preview-title">Untitled Architecture</span>
        <span className="preview-saved">Saved</span>
      </div>
      <svg
        viewBox="0 0 860 320"
        xmlns="http://www.w3.org/2000/svg"
        className="preview-canvas"
        aria-hidden="true"
      >
        <defs>
          <pattern id="pg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.75" fill="#252528" />
          </pattern>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#3a3a3c" />
          </marker>
        </defs>

        {/* background */}
        <rect width="860" height="320" fill="#0c0c0e" />
        <rect width="860" height="320" fill="url(#pg)" />

        {/* connection lines */}
        <line x1="170" y1="145" x2="218" y2="145" stroke="#2a2a2e" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="390" y1="145" x2="438" y2="145" stroke="#2a2a2e" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="610" y1="145" x2="658" y2="145" stroke="#2a2a2e" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="305" y1="170" x2="305" y2="233" stroke="#2a2a2e" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arr)" />

        {/* protocol labels */}
        <text x="194" y="136" textAnchor="middle" fontSize="9.5" fill="#484850" fontFamily="-apple-system, sans-serif">HTTPS</text>
        <text x="414" y="136" textAnchor="middle" fontSize="9.5" fill="#484850" fontFamily="-apple-system, sans-serif">gRPC</text>
        <text x="634" y="136" textAnchor="middle" fontSize="9.5" fill="#484850" fontFamily="-apple-system, sans-serif">SQL</text>
        <text x="314" y="213" fontSize="9.5" fill="#484850" fontFamily="-apple-system, sans-serif">Pub/Sub</text>

        {/* node: Client */}
        <rect x="30" y="120" width="140" height="50" rx="8" fill="#1c1c1e" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="46" cy="134" r="3.5" fill="#a78bfa" />
        <text x="100" y="142" textAnchor="middle" fontSize="12" fontWeight="500" fill="#e5e5e7" fontFamily="-apple-system, sans-serif">Client</text>
        <text x="100" y="157" textAnchor="middle" fontSize="10" fill="#555" fontFamily="-apple-system, sans-serif">Browser</text>

        {/* node: API Gateway */}
        <rect x="220" y="120" width="170" height="50" rx="8" fill="#1c1c1e" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="236" cy="134" r="3.5" fill="#0A84FF" />
        <text x="305" y="142" textAnchor="middle" fontSize="12" fontWeight="500" fill="#e5e5e7" fontFamily="-apple-system, sans-serif">API Gateway</text>
        <text x="305" y="157" textAnchor="middle" fontSize="10" fill="#555" fontFamily="-apple-system, sans-serif">nginx</text>

        {/* node: User Service — selected */}
        <rect x="440" y="120" width="170" height="50" rx="8" fill="rgba(10,132,255,0.07)" stroke="rgba(10,132,255,0.45)" strokeWidth="1.5" />
        <circle cx="456" cy="134" r="3.5" fill="#34d399" />
        <text x="525" y="142" textAnchor="middle" fontSize="12" fontWeight="500" fill="#e5e5e7" fontFamily="-apple-system, sans-serif">User Service</text>
        <text x="525" y="157" textAnchor="middle" fontSize="10" fill="#555" fontFamily="-apple-system, sans-serif">Node.js</text>

        {/* node: PostgreSQL */}
        <rect x="660" y="120" width="170" height="50" rx="8" fill="#1c1c1e" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="676" cy="134" r="3.5" fill="#f43f5e" />
        <text x="745" y="142" textAnchor="middle" fontSize="12" fontWeight="500" fill="#e5e5e7" fontFamily="-apple-system, sans-serif">PostgreSQL</text>
        <text x="745" y="157" textAnchor="middle" fontSize="10" fill="#555" fontFamily="-apple-system, sans-serif">Primary DB</text>

        {/* node: Message Queue */}
        <rect x="220" y="235" width="170" height="50" rx="8" fill="#1c1c1e" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="236" cy="249" r="3.5" fill="#fb923c" />
        <text x="305" y="257" textAnchor="middle" fontSize="12" fontWeight="500" fill="#e5e5e7" fontFamily="-apple-system, sans-serif">Message Queue</text>
        <text x="305" y="272" textAnchor="middle" fontSize="10" fill="#555" fontFamily="-apple-system, sans-serif">RabbitMQ</text>

        {/* collaborator cursor */}
        <polygon points="588,188 588,202 594,198" fill="#0A84FF" />
        <rect x="596" y="183" width="38" height="17" rx="4" fill="#0A84FF" />
        <text x="615" y="195" textAnchor="middle" fontSize="10" fill="white" fontWeight="500" fontFamily="-apple-system, sans-serif">Sofia</text>
      </svg>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-logo">
          <img src="/logos/khora-solar-coil-white.png" alt="" className="nav-logo-img" />
          <span className="nav-logo-text">Khora</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <h1 className="hero-title">Design system architectures together.</h1>
        <p className="hero-subtitle">
          A collaborative canvas for mapping services, data flows, and infrastructure with your team in real time.
        </p>
        <div className="hero-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Get Started</button>
          <button className="btn-ghost btn-large" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </section>

      <section className="preview-section">
        <CanvasPreview />
      </section>
    </div>
  )
}

export default LandingPage
