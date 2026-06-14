const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

let db

function getDbPath() {
  try {
    const { app } = require('electron')
    return path.join(app.getPath('userData'), 'velocity-operations.db')
  } catch {
    return path.join(process.cwd(), 'velocity-operations.db')
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

function initDb() {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  db.exec(schema)

  seedDefaultWizard()

  console.log(`Database ready at ${dbPath}`)
  return db
}

function seedDefaultWizard() {
  const count = db.prepare('SELECT COUNT(*) as n FROM users').get().n
  if (count === 0) {
    const hash = bcrypt.hashSync('changeme', 10)
    db.prepare(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    ).run('admin', hash, 'wizard')
    console.log('Default Wizard created — username: admin, password: changeme')
  }
}

module.exports = { getDb, initDb }
