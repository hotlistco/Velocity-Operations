const express = require('express')
const { getDb } = require('../db')
const { requireAuth, requireWizard } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function genWorkOrderNumber() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const r = String(Math.floor(Math.random() * 9000) + 1000)
  return `WO-${d}-${r}`
}

router.get('/', (req, res) => {
  const db = getDb()
  const { search, status, progress, shelf_status, location, priority, delivery_required, due_from, due_to } = req.query

  let q = 'SELECT * FROM work_orders WHERE 1=1'
  const p = []

  if (search) {
    q += ' AND (client_name LIKE ? OR job_description LIKE ? OR work_order_number LIKE ? OR invoice_number LIKE ?)'
    const s = `%${search}%`
    p.push(s, s, s, s)
  }
  if (status !== undefined && status !== '') { q += ' AND status = ?'; p.push(status) }
  if (progress !== undefined && progress !== '') { q += ' AND progress = ?'; p.push(progress) }
  if (shelf_status) { q += ' AND shelf_status = ?'; p.push(shelf_status) }
  if (location) { q += ' AND physical_location = ?'; p.push(location) }
  if (priority !== undefined && priority !== '') { q += ' AND priority_level = ?'; p.push(priority) }
  if (delivery_required !== undefined && delivery_required !== '') { q += ' AND delivery_required = ?'; p.push(delivery_required) }
  if (due_from) { q += ' AND due_date >= ?'; p.push(due_from) }
  if (due_to) { q += ' AND due_date <= ?'; p.push(due_to) }

  q += ' ORDER BY priority_level DESC, due_date ASC'

  res.json(db.prepare(q).all(...p))
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Work order not found' })
  res.json(order)
})

router.post('/', requireWizard, (req, res) => {
  const db = getDb()
  const w = req.body
  const won = genWorkOrderNumber()

  const result = db.prepare(`
    INSERT INTO work_orders (
      work_order_number, invoice_number, client_name, client_phone, client_email,
      job_description, short_description, special_services, due_date,
      priority_level, delivery_required, physical_location, shelf_status,
      status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    won,
    w.invoice_number || null,
    w.client_name,
    w.client_phone || null,
    w.client_email || null,
    w.job_description || null,
    w.short_description || null,
    w.special_services || null,
    w.due_date || null,
    w.priority_level ?? 5,
    w.delivery_required ? 1 : 0,
    w.physical_location || null,
    w.shelf_status || 'INCOMING',
    w.status || null,
    w.notes || null
  )

  res.status(201).json({ id: result.lastInsertRowid, work_order_number: won })
})

const WIZARD_FIELDS = new Set([
  'invoice_number', 'client_name', 'client_phone', 'client_email',
  'job_description', 'short_description', 'special_services',
  'due_date', 'priority_level', 'delivery_required',
  'physical_location', 'shelf_status', 'paid'
])
const APPRENTICE_FIELDS = new Set(['progress', 'status', 'notes', 'deliverable_path'])

router.patch('/:id', (req, res) => {
  const db = getDb()
  const order = db.prepare('SELECT id FROM work_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Work order not found' })

  const isWizard = req.user.role === 'wizard'
  const updates = req.body

  for (const key of Object.keys(updates)) {
    if (!APPRENTICE_FIELDS.has(key) && !WIZARD_FIELDS.has(key)) continue
    if (WIZARD_FIELDS.has(key) && !isWizard) {
      return res.status(403).json({ error: `Field '${key}' requires Wizard role` })
    }
  }

  const allowed = isWizard
    ? new Set([...WIZARD_FIELDS, ...APPRENTICE_FIELDS])
    : APPRENTICE_FIELDS

  const sets = []
  const params = []
  for (const [key, val] of Object.entries(updates)) {
    if (allowed.has(key)) { sets.push(`${key} = ?`); params.push(val) }
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

  params.push(req.params.id)
  db.prepare(`UPDATE work_orders SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.delete('/:id', requireWizard, (req, res) => {
  getDb().prepare('DELETE FROM work_orders WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
