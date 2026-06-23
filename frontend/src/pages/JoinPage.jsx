import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

// this page handles the invite link flow: /join/:token
// when someone opens an invite link they land here, we call the backend to register
// them as a room member, then redirect them straight to the canvas
function JoinPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function join() {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/rooms/join/${token}`)
        if (!res) return
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'invalid invite link')
          return
        }

        // backend returns the room slug so we can redirect directly to the canvas
        navigate(`/room/${data.slug}`, { replace: true })
      } catch (err) {
        setError('something went wrong')
      }
    }

    join()
  }, [token])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}>
        <div>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>go to dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
      joining room...
    </div>
  )
}

export default JoinPage
