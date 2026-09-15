import { Router } from 'express'
import multer from 'multer'
import { parseItineraryDocx } from './importParser.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 150 } })

router.post('/parse', upload.array('files', 150), async (req, res) => {
  const files = req.files || []
  if (files.length === 0) return res.status(400).json({ error: 'No files uploaded.' })

  const results = []
  for (const file of files) {
    try {
      const parsed = await parseItineraryDocx(file.buffer)
      results.push({ filename: file.originalname, ok: true, parsed })
    } catch (err) {
      results.push({ filename: file.originalname, ok: false, error: err.message })
    }
  }
  res.json({ results })
})

export default router
