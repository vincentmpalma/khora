import jwt from 'jsonwebtoken'

function authMiddleware(req, res, next) {

    console.log('authMiddleware called')

 // .header for headers and .authorization for tokens
 // would be "Bearer <token>" if the token is sent in the standard way
  const authHeader = req.headers.authorization

  // check if authHeader exists and if its in Bearer format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no token provided' })
  }

  // split to get actual token
  const token = authHeader.split(' ')[1]

  console.log('token extracted:', token)

  try {
    // use jwt.verify to decode the token and verify its signature by using signature from .env and payload and header from token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // req.user will be the decoded payload of the token, which should contain user info like id and email and is available to any route handler that uses this middleware
    req.user = decoded
    console.log('token verified, user info:', req.user)
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

export default authMiddleware
