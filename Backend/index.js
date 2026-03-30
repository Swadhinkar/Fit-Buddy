import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'
import userRouter from './routes/user.route.js'
import cookieParser from "cookie-parser";
import aiRouter from './routes/ai.route.js'
import foodRouter from './routes/food.route.js'
import logRouter from './routes/log.route.js'

import { authLimiter, apiLimiter, heavyLimiter } from './middleware/rateLimiter.js'

const app = express()
dotenv.config()
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use((req, res, next) => {
    console.log(`Route hit: ${req.method} ${req.originalUrl}`)

    if (req.originalUrl.startsWith('/log')) {
        console.log(`Auth header: ${req.headers.authorization || 'missing'}`)
    }

    next()
})

const PORT = process.env.PORT || 7001
const URI = process.env.MONGO_URI

mongoose.connect(URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error connnecting to MongoDB:", err))

app.get('/xyztestabc', (req, res) => {
    res.status(200).send('API is working properly')
})

app.use('/user', userRouter)
app.use('/ai', aiRouter)
app.use('/food', foodRouter)
app.use('/log', logRouter)

app.use("/user", authLimiter);
app.use("/ai", heavyLimiter);
app.use("/food", apiLimiter);
app.use("/log", heavyLimiter);
app.use("/", apiLimiter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
