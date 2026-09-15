import { Router } from 'express'
import db from './db.js'

const router = Router()

const STATUSES = ['draft', 'sent', 'confirmed']

function serialize(row) {
  return { ...row, days: JSON.parse(row.days), cost_rows: JSON.parse(row.cost_rows || '[]') }
}

function fieldsFromBody(body) {
  const {
    client_name,
    destination,
    subtitle,
    duration,
    package_title,
    tagline,
    departure_dates,
    assembly_point,
    days,
    inclusions,
    exclusions,
    cost_rows,
    child_policy,
    visa_info,
    status,
  } = body
  return {
    client_name,
    destination,
    subtitle,
    duration,
    package_title,
    tagline,
    departure_dates,
    assembly_point,
    days,
    inclusions,
    exclusions,
    cost_rows,
    child_policy,
    visa_info,
    status,
  }
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
  const f = fieldsFromBody(req.body)
  if (!f.client_name || !f.client_name.trim()) return res.status(400).json({ error: 'Client name is required.' })
  if (!f.destination || !f.destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  const now = new Date().toISOString()
  const info = await db.execute({
    sql: `INSERT INTO itineraries
      (client_name, destination, subtitle, duration, package_title, tagline, departure_dates, assembly_point,
       days, inclusions, exclusions, cost_rows, child_policy, visa_info, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      f.client_name.trim(),
      f.destination.trim(),
      f.subtitle || '',
      f.duration || '',
      f.package_title || '',
      f.tagline || '',
      f.departure_dates || '',
      f.assembly_point || '',
      JSON.stringify(f.days || []),
      f.inclusions || '',
      f.exclusions || '',
      JSON.stringify(f.cost_rows || []),
      f.child_policy || '',
      f.visa_info || '',
      STATUSES.includes(f.status) ? f.status : 'draft',
      now,
      now,
    ],
  })
  const created = await db.execute({ sql: 'SELECT * FROM itineraries WHERE id = ?', args: [Number(info.lastInsertRowid)] })
  res.status(201).json(serialize(created.rows[0]))
})

router.put('/:id', async (req, res) => {
  const f = fieldsFromBody(req.body)
  if (!f.client_name || !f.client_name.trim()) return res.status(400).json({ error: 'Client name is required.' })
  await db.execute({
    sql: `UPDATE itineraries SET
      client_name = ?, destination = ?, subtitle = ?, duration = ?, package_title = ?, tagline = ?,
      departure_dates = ?, assembly_point = ?, days = ?, inclusions = ?, exclusions = ?, cost_rows = ?,
      child_policy = ?, visa_info = ?, status = ?, updated_at = ?
      WHERE id = ?`,
    args: [
      f.client_name.trim(),
      f.destination.trim(),
      f.subtitle || '',
      f.duration || '',
      f.package_title || '',
      f.tagline || '',
      f.departure_dates || '',
      f.assembly_point || '',
      JSON.stringify(f.days || []),
      f.inclusions || '',
      f.exclusions || '',
      JSON.stringify(f.cost_rows || []),
      f.child_policy || '',
      f.visa_info || '',
      STATUSES.includes(f.status) ? f.status : 'draft',
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
