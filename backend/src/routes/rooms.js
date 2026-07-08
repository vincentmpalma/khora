import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db.js'
import authMiddleware from './middleware.js'

const router = Router()

// create a new room
// generates a url-safe slug from the name + timestamp to keep it unique
// also generates a random invite_token upfront so the owner can share it any time
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ error: 'name is required' })
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  const owner_id = req.user.id
  // 16 random bytes = 32 hex chars — long enough to be unguessable
  const invite_token = crypto.randomBytes(16).toString('hex')

  try {
    const result = await pool.query(
      'INSERT INTO rooms (name, slug, owner_id, invite_token) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, owner_id, invite_token]
    )
    res.status(201).json({ room: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// list all rooms owned by the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT id, name, slug, created_at, updated_at, canvas_state FROM rooms WHERE owner_id = $1 ORDER BY COALESCE(updated_at, created_at) DESC',
      [owner_id]
    )
    res.json({ rooms: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// public guest preview — validates invite token and returns slug + name without requiring auth
// used so unauthenticated users can see the room name before choosing a guest display name
router.get('/guest-join/:token', async (req, res) => {
  const { token } = req.params
  try {
    const result = await pool.query(
      'SELECT slug, name FROM rooms WHERE invite_token = $1',
      [token]
    )
    const room = result.rows[0]
    if (!room) return res.status(404).json({ error: 'invalid invite link' })
    res.json({ slug: room.slug, name: room.name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// accept an invite link
// the token in the url is looked up in the rooms table — if it matches, the user is added
// to room_members so they can access the room going forward
// ON CONFLICT DO NOTHING handles the case where they click the link more than once
// returns the room slug so the frontend can redirect them straight to the canvas
router.get('/join/:token', authMiddleware, async (req, res) => {
  const { token } = req.params
  const user_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE invite_token = $1',
      [token]
    )
    const room = result.rows[0]

    if (!room) {
      return res.status(404).json({ error: 'invalid invite link' })
    }

    // owner already has access — no need to insert them into room_members
    if (room.owner_id !== user_id) {
      await pool.query(
        'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [room.id, user_id]
      )
    }

    res.json({ slug: room.slug })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// get a single room by slug — used by CanvasPage on load to fetch canvas state
// access is allowed if the user is the owner OR is in room_members (was invited)
router.get('/:slug', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const user_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE slug = $1',
      [slug]
    )
    const room = result.rows[0]

    if (!room) {
      return res.status(404).json({ error: 'room not found' })
    }

    if (room.owner_id !== user_id) {
      const memberResult = await pool.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [room.id, user_id]
      )
      if (memberResult.rowCount === 0) {
        return res.status(403).json({ error: 'forbidden' })
      }
    }

    res.json({ room })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// returns the invite_token for a room — owner only
// the frontend uses this to construct the shareable link: /join/<token>
// the token itself is not a secret per se — anyone with it can join —
// but only the owner can fetch it, so they control who they share it with
router.post('/:slug/invite', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'SELECT invite_token FROM rooms WHERE slug = $1 AND owner_id = $2',
      [slug, owner_id]
    )
    const room = result.rows[0]

    if (!room) {
      return res.status(404).json({ error: 'room not found' })
    }

    res.json({ invite_token: room.invite_token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// save canvas state — called by the debounced save in CanvasPage every 1.5s after a change
// allows both the owner and invited members to save, since collaborators can also make edits
router.patch('/:slug', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const { canvas_state, name } = req.body
  const user_id = req.user.id

  try {
    const roomResult = await pool.query('SELECT id, owner_id FROM rooms WHERE slug = $1', [slug])
    const room = roomResult.rows[0]

    if (!room) {
      return res.status(404).json({ error: 'room not found' })
    }

    if (room.owner_id !== user_id) {
      const memberResult = await pool.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [room.id, user_id]
      )
      if (memberResult.rowCount === 0) {
        return res.status(403).json({ error: 'forbidden' })
      }
    }

    if (canvas_state !== undefined) {
      await pool.query('UPDATE rooms SET canvas_state = $1, updated_at = NOW() WHERE id = $2', [canvas_state, room.id])
    }
    if (name && room.owner_id === user_id) {
      await pool.query('UPDATE rooms SET name = $1, updated_at = NOW() WHERE id = $2', [name.trim(), room.id])
    }
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// delete a room — owner only
router.delete('/:slug', authMiddleware, async (req, res) => {
  const { slug } = req.params
  const owner_id = req.user.id

  try {
    const result = await pool.query(
      'DELETE FROM rooms WHERE slug = $1 AND owner_id = $2 RETURNING id',
      [slug, owner_id]
    )
    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'not found or forbidden' })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

export default router
