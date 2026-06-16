import { Navigate } from 'react-router-dom'

// children is whatever is wrapped inside <ProtectedRoute>...</ProtectedRoute> in App.jsx
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  // <Navigate> is used instead of navigate() because we're outside a handler 
  // we're in the render phase, so we return a component that triggers the redirect
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
