import express from 'express'
import cors from 'cors'
import { ready } from './db.js'
import templatesRouter from './templates.routes.js'
import itinerariesRouter from './itineraries.routes.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(async (req, res, next) => {
  await ready()
  next()
})

app.use('/api/templates', templatesRouter)
app.use('/api/itineraries', itinerariesRouter)

export default app
