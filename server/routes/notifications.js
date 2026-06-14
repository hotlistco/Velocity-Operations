const express = require('express')
const { getDb } = require('../db')
const { requireAuth, requireWizard } = require('../middleware/auth')
const { sendEmail } = require('../services/gmail')

const router = express.Router()
router.use(requireAuth)

router.get('/alerts', (req, res) => {
  const db = getDb()
  const threshold = parseInt(
    db.prepare("SELECT value FROM settings WHERE key = 'alert_threshold_days'").get()?.value ?? '3'
  )

  const today = new Date().toISOString().slice(0, 10)
  const soonDate = new Date(Date.now() + threshold * 86400000).toISOString().slice(0, 10)

  const overdue = db.prepare(
    "SELECT * FROM work_orders WHERE due_date < ? AND progress = 0 ORDER BY due_date ASC"
  ).all(today)

  const due_soon = db.prepare(
    "SELECT * FROM work_orders WHERE due_date BETWEEN ? AND ? AND progress = 0 ORDER BY due_date ASC"
  ).all(today, soonDate)

  res.json({ overdue, due_soon })
})

router.get('/templates', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM email_templates').all())
})

router.put('/templates/:type', requireWizard, (req, res) => {
  const { subject, body } = req.body
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body required' })
  getDb().prepare(
    'UPDATE email_templates SET subject = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE type = ?'
  ).run(subject, body, req.params.type)
  res.json({ success: true })
})

router.post('/send', async (req, res) => {
  const { to_email, subject, body } = req.body
  if (!to_email || !subject || !body) return res.status(400).json({ error: 'to_email, subject, and body required' })

  try {
    await sendEmail({ to: to_email, subject, body })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/settings', (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  delete settings.gmail_credentials
  res.json(settings)
})

router.put('/settings', requireWizard, (req, res) => {
  const db = getDb()
  const allowed = ['alert_threshold_days', 'shop_name', 'shop_email']
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  const updateMany = db.transaction((entries) => {
    for (const [key, value] of entries) {
      if (allowed.includes(key)) upsert.run(key, String(value))
    }
  })
  updateMany(Object.entries(req.body))
  res.json({ success: true })
})

module.exports = router
