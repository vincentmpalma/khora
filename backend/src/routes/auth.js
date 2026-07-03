import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db.js'
import jwt from 'jsonwebtoken';
import authMiddleware from './middleware.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, username } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const resolvedUsername = (username || '').trim() || email.split('@')[0]

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email, passwordHash, resolvedUsername]
    )
    res.status(201).json({ user: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'email already in use' })
    }
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

router.post('/login', async (req, res)=>{
  const {email, password} = req.body;

  if(!email || !password){
    return res.status(400).json({error: 'email and password are required'})
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if(!user){
      return res.status(401).json({error: 'invalid credentials'})
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if(!passwordMatch){
      return res.status(401).json({error: 'invalid credentials'})
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, {expiresIn: '1h'})

    return res.json({ token, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err) {
    console.error(err)
    res.status(500).json({error: 'server error'})
  }
})

router.get("/me", authMiddleware, async (req, res) => {
  res.json({ message: "yay it worked" })
})

export default router
