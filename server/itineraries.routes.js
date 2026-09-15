import { Router } from 'express'
import db from './db.js'

const router = Router()

const STATUSES = ['draft', 'sent', 'confirmed']

function serialize(row) {
  return { ...row, days: JSON.parse(row.days) }
}

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM itineraries ORDER BY created_at DESC')
  res.json(result.rows.map(serialize))
})

router.get('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM itineraries WHERE id = ?', args: [req.params.id] })
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found.' })
  res.json(serialize(result.rows[0]))
})

router.post('/', async (req, res) => {
  const { client_name, destination, subtitle, duration, days, status } = req.body
  if (!client_name || !client_name.trim()) return res.status(400).json({ error: 'Client name is required.' })
  if (!destination || !destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  const now = new Date().toISOString()
  const info = await db.execute({
    sql: 'INSERT INTO itineraries (client_name, destination, subtitle, duration, days, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      client_name.trim(),
      destination.trim(),
      subtitle || '',
      duration || '',
      JSON.stringify(days || []),
      STATUSES.includes(status) ? status : 'draft',
      now,
      now,
    ],
  })
  const created = await db.execute({ sql: 'SELECT * FROM itineraries WHERE id = ?', args: [Number(info.lastInsertRowid)] })
  res.status(201).json(serialize(created.rows[0]))
})

router.put('/:id', async (req, res) => {
  const { client_name, destination, subtitle, duration, days, status } = req.body
  if (!client_name || !client_name.trim()) return res.status(400).json({ error: 'Client name is required.' })
  await db.execute({
    sql: 'UPDATE itineraries SET client_name = ?, destination = ?, subtitle = ?, duration = ?, days = ?, status = ?, updated_at = ? WHERE id = ?',
    args: [
      client_name.trim(),
      destination.trim(),
      subtitle || '',
      duration || '',
      JSON.stringify(days || []),
      STATUSES.includes(status) ? status : 'draft',
      new Date().toISOString(),
      req.params.id,
    ],
  })
  const updated = await db.execute({ sql: 'SELECT * FROM itineraries WHERE id = ?', args: [req.params.id] })
  res.json(serialize(updated.rows[0]))
})

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM itineraries WHERE id = ?', args: [req.params.id] })
  res.status(204).end()
})

export default router
