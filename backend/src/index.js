import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { YSocketIO } from 'y-socket.io/dist/server'
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import pool from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/rooms', roomRoutes)

// wrap express in an http server so we have a reference to hand to socket.io
// app.listen() creates the http server invisibly with no reference — socket.io needs it
const httpServer = createServer(app)

// websockets don't use request-response like http — they stay open persistently
// socket.io intercepts the "upgrade: websocket" http request and keeps the connection alive
// after that both sides can emit events to each other at any time without waiting for a request
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// yjs document sync — instead of manually writing socket events, y-socket.io handles
// all the syncing internally using its own set of events over the socket connection
// it uses namespaces matching /^\/yjs\|.*$/ so it doesn't conflict with our other socket logic
const ysocketio = new YSocketIO(io)
ysocketio.initialize()

// seed the server-side yjs doc from the db the first time a room is opened
// this fires once per room per server lifetime (when the in-memory doc is first created)
// doing it here instead of the client avoids the race where provider.on('sync') fires
// before the server's state vector has been applied to the local ydoc
ysocketio.on('document-loaded', async (doc) => {
  const slug = doc.name
  try {
    const result = await pool.query('SELECT canvas_state FROM rooms WHERE slug = $1', [slug])
    if (!result.rows[0]) return
    const { nodes = [], edges = [] } = result.rows[0].canvas_state || {}
    if (!nodes.length && !edges.length) return

    const yNodes = doc.getArray('nodes')
    const yEdges = doc.getArray('edges')
    if (yNodes.length > 0) return

    doc.transact(() => {
      yNodes.push(nodes)
      yEdges.push(edges)
    })
  } catch (err) {
    console.error('error seeding yjs doc from db:', err)
  }
})

// start the http server we created instead of app.listen()
httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
