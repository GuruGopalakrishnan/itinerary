import { Router } from 'express'
import db from './db.js'

const router = Router()

function serialize(row) {
  return { ...row, days: JSON.parse(row.days) }
}

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM templates ORDER BY id')
  res.json(result.rows.map(serialize))
})

router.post('/', async (req, res) => {
  const { destination, subtitle, default_duration, days } = req.body
  if (!destination || !destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  const info = await db.execute({
    sql: 'INSERT INTO templates (destination, subtitle, default_duration, days, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [destination.trim(), subtitle || '', default_duration || '', JSON.stringify(days || []), new Date().toISOString()],
  })
  const created = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [Number(info.lastInsertRowid)] })
  res.status(201).json(serialize(created.rows[0]))
})

router.put('/:id', async (req, res) => {
  const { destination, subtitle, default_duration, days } = req.body
  if (!destination || !destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  await db.execute({
    sql: 'UPDATE templates SET destination = ?, subtitle = ?, default_duration = ?, days = ? WHERE id = ?',
    args: [destination.trim(), subtitle || '', default_duration || '', JSON.stringify(days || []), req.params.id],
  })
  const updated = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [req.params.id] })
  res.json(serialize(updated.rows[0]))
})

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM templates WHERE id = ?', args: [req.params.id] })
  res.status(204).end()
})

export default router
