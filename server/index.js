import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 4100

app.listen(PORT, () => {
  console.log(`Itinerary Studio API listening on http://localhost:${PORT}`)
})
