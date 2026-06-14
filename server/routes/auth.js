const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../db')
const { requireAuth, requireWizard, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  )
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email } })
})

router.get('/me', requireAuth, (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, role, email FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

router.get('/users', requireAuth, requireWizard, (req, res) => {
  const db = getDb()
  res.json(db.prepare('SELECT id, username, role, email, created_at FROM users ORDER BY username').all())
})

router.post('/users', requireAuth, requireWizard, (req, res) => {
  const { username, password, role, email } = req.body
  if (!username || !password || !role) return res.status(400).json({ error: 'Username, password, and role required' })
  if (!['wizard', 'apprentice'].includes(role)) return res.status(400).json({ error: 'Role must be wizard or apprentice' })

  const db = getDb()
  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)'
    ).run(username, hash, role, email || null)
    res.status(201).json({ id: result.lastInsertRowid, username, role })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' })
    throw e
  }
})

router.put('/users/:id/password', requireAuth, requireWizard, (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })
  const db = getDb()
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id)
  res.json({ success: true })
})

router.delete('/users/:id', requireAuth, requireWizard, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' })
  const db = getDb()
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
