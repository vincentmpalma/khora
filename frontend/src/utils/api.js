// wrapper around fetch that automatically attaches the auth token
// and redirects to /login on 401 (expired or invalid token)
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token')

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return null
  }

  return res
}
