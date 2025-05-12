import express from 'express'
import cors from 'cors'
import http from 'http'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.routes.js'
import chatRequestRouter from './routes/chatRequest.routes.js'
import chatIdRouter from './routes/chat.routes.js'
import messageRouter from './routes/message.routes.js'
import { setupSocket } from './realtime/socket.js'

const app = express()
const server = http.createServer(app) // <-- create HTTP server

setupSocket(server) // <-- pass server to setupSocket

app.use(cors({
    origin: "https://im-pager.vercel.app/",
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRouter)
app.use("/api/v1/chatrequest", chatRequestRouter)
app.use("/api/v1/chat", chatIdRouter)
app.use("/api/v1/message", messageRouter)

app.get("/", (req, res) => {
    res.send("ImPager's Server is up and running")
})

export { app, server } 
