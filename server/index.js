const express = require('express')
const cors = require('cors')

const { initDb } = require('./db')
const authRoutes = require('./routes/auth')
const workOrderRoutes = require('./routes/workorders')
const importRoutes = require('./routes/import')
const notificationRoutes = require('./routes/notifications')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

initDb()

app.use('/api/auth', authRoutes)
app.use('/api/workorders', workOrderRoutes)
app.use('/api/import', importRoutes)
app.use('/api/notifications', notificationRoutes)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Velocity Operations server listening on port ${PORT}`)
})

module.exports = app
