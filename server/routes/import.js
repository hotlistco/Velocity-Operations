const express = require('express')
const multer = require('multer')
const { requireAuth, requireWizard } = require('../middleware/auth')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(requireAuth, requireWizard)

// TODO: Implement once POS file format is confirmed.
// Expected: file upload (CSV/Excel/PDF TBD) with fields: invoice_number, job_description, due_date (minimum).
// Must support date range selection for the schedule window.
// Provide a sample POS export file to complete this integration.
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  res.status(501).json({
    error: 'Import not yet implemented',
    detail: 'POS file format is pending confirmation. Provide a sample export file to complete this feature.',
    received: { filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype }
  })
})

module.exports = router
