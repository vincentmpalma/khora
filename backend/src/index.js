import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { YSocketIO } from 'y-socket.io/dist/server'
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'

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
// app.listen() would create this invisibly and we couldn't attach socket.io to it
const httpServer = createServer(app)

// socket.io attaches to the same http server — it intercepts websocket upgrade
// requests on the same port so express and socket.io share port 3001
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// YSocketIO manages yjs document sync — pass it the socket.io server instance
// it creates namespaces matching /^\/yjs\|.*$/ so it doesn't conflict with other socket logic
const ysocketio = new YSocketIO(io)
ysocketio.initialize()

// start the http server we created instead of app.listen()
httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
