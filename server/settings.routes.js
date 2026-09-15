import { Router } from 'express'
import db from './db.js'

const router = Router()

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM settings WHERE id = 1')
  res.json(result.rows[0] || {})
})

router.put('/', async (req, res) => {
  const { company_name, gst_no, email, phone, address, website, logo, booking_terms, cancellation_policy, important_notes } = req.body
  await db.execute({
    sql: `UPDATE settings SET
      company_name = ?, gst_no = ?, email = ?, phone = ?, address = ?, website = ?, logo = ?,
      booking_terms = ?, cancellation_policy = ?, important_notes = ?
      WHERE id = 1`,
    args: [
      company_name || '',
      gst_no || '',
      email || '',
      phone || '',
      address || '',
      website || '',
      logo || null,
      booking_terms || '',
      cancellation_policy || '',
      important_notes || '',
    ],
  })
  const updated = await db.execute('SELECT * FROM settings WHERE id = 1')
  res.json(updated.rows[0])
})

export default router
