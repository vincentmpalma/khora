import { Link, useNavigate } from 'react-router-dom'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Start designing with your team</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" type="password" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary btn-full">Create Account</button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
