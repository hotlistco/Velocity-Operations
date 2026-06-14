const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'velocity-ops-dev-secret'

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function requireWizard(req, res, next) {
  if (req.user?.role !== 'wizard') return res.status(403).json({ error: 'Wizard role required' })
  next()
}

module.exports = { requireAuth, requireWizard, JWT_SECRET }
