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
      'SELECT id, name, slug, created_at FROM rooms WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    )
    res.json({ rooms: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

router.get('/:slug', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE slug = $1',
      [slug]
    )
    const room = result.rows[0]

    if (!room) {
      return res.status(404).json({ error: 'room not found' })
    }

    // make sure the requesting user owns this room
    if (room.owner_id !== owner_id) {
      return res.status(403).json({ error: 'forbidden' })
    }

    res.json({ room })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

router.patch('/:slug', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const { canvas_state } = req.body
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'UPDATE rooms SET canvas_state = $1 WHERE slug = $2 AND owner_id = $3 RETURNING id',
      [canvas_state, slug, owner_id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'room not found' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

export default router
