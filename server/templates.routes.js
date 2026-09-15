import { Router } from 'express'
import db from './db.js'

const router = Router()

function serialize(row) {
  return { ...row, days: JSON.parse(row.days), cost_rows: JSON.parse(row.cost_rows || '[]') }
}

function fieldsFromBody(body) {
  const {
    destination,
    subtitle,
    default_duration,
    package_title,
    tagline,
    assembly_point,
    days,
    inclusions,
    exclusions,
    cost_rows,
    child_policy,
    visa_info,
    country,
    uploaded_at,
    raw_html,
    raw_docx_base64,
    raw_filename,
  } = body
  return {
    destination,
    subtitle,
    default_duration,
    package_title,
    tagline,
    assembly_point,
    days,
    inclusions,
    exclusions,
    cost_rows,
    child_policy,
    visa_info,
    country,
    uploaded_at,
    raw_html,
    raw_docx_base64,
    raw_filename,
  }
}

router.get('/', async (req, res) => {
  const result = await db.execute(
    'SELECT id, destination, subtitle, default_duration, package_title, tagline, assembly_point, days, inclusions, exclusions, cost_rows, child_policy, visa_info, country, uploaded_at, raw_filename, created_at FROM templates ORDER BY id',
  )
  res.json(result.rows.map(serialize))
})

router.get('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [req.params.id] })
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found.' })
  res.json(serialize(result.rows[0]))
})

router.post('/', async (req, res) => {
  const f = fieldsFromBody(req.body)
  if (!f.destination || !f.destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  const now = new Date().toISOString()
  const info = await db.execute({
    sql: `INSERT INTO templates
      (destination, subtitle, default_duration, package_title, tagline, assembly_point, days, inclusions, exclusions, cost_rows, child_policy, visa_info, country, uploaded_at, raw_html, raw_docx_base64, raw_filename, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      f.destination.trim(),
      f.subtitle || '',
      f.default_duration || '',
      f.package_title || '',
      f.tagline || '',
      f.assembly_point || '',
      JSON.stringify(f.days || []),
      f.inclusions || '',
      f.exclusions || '',
      JSON.stringify(f.cost_rows || []),
      f.child_policy || '',
      f.visa_info || '',
      f.country || '',
      f.uploaded_at || now,
      f.raw_html || '',
      f.raw_docx_base64 || '',
      f.raw_filename || '',
      now,
    ],
  })
  const created = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [Number(info.lastInsertRowid)] })
  res.status(201).json(serialize(created.rows[0]))
})

router.put('/:id', async (req, res) => {
  const f = fieldsFromBody(req.body)
  if (!f.destination || !f.destination.trim()) return res.status(400).json({ error: 'Destination is required.' })
  await db.execute({
    sql: `UPDATE templates SET
      destination = ?, subtitle = ?, default_duration = ?, package_title = ?, tagline = ?, assembly_point = ?,
      days = ?, inclusions = ?, exclusions = ?, cost_rows = ?, child_policy = ?, visa_info = ?, country = ?
      WHERE id = ?`,
    args: [
      f.destination.trim(),
      f.subtitle || '',
      f.default_duration || '',
      f.package_title || '',
      f.tagline || '',
      f.assembly_point || '',
      JSON.stringify(f.days || []),
      f.inclusions || '',
      f.exclusions || '',
      JSON.stringify(f.cost_rows || []),
      f.child_policy || '',
      f.visa_info || '',
      f.country || '',
      req.params.id,
    ],
  })
  const updated = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [req.params.id] })
  res.json(serialize(updated.rows[0]))
})

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM templates WHERE id = ?', args: [req.params.id] })
  res.status(204).end()
})

export default router
