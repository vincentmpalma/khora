import { Router } from 'express'
import pool from '../db.js'
import authMiddleware from './middleware.js'

const router = Router()

router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ error: 'name is required' })
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'INSERT INTO rooms (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, owner_id]
    )
    res.status(201).json({ room: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    )
    res.json({ rooms: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

export default router
