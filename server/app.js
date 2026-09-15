import express from 'express'
import cors from 'cors'
import { ready } from './db.js'
import templatesRouter from './templates.routes.js'
import itinerariesRouter from './itineraries.routes.js'
import settingsRouter from './settings.routes.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(async (req, res, next) => {
  await ready()
  next()
})

app.use('/api/templates', templatesRouter)
app.use('/api/itineraries', itinerariesRouter)
app.use('/api/settings', settingsRouter)

export default app
