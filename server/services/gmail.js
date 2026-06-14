const { google } = require('googleapis')
const { getDb } = require('../db')

// TODO: Configure Gmail API credentials in Settings > Email during development setup.
// Store OAuth2 client_id, client_secret, redirect_uri, and tokens in the settings table
// under key 'gmail_credentials' as a JSON string. Never hardcode credentials.
// Reference: https://developers.google.com/gmail/api/quickstart/nodejs

function getCredentials() {
  const db = getDb()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'gmail_credentials'").get()
  if (!row) throw new Error('Gmail not configured. Go to Settings > Email to connect your Gmail account.')
  return JSON.parse(row.value)
}

function buildAuthClient(credentials) {
  const auth = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uri
  )
  auth.setCredentials(credentials.tokens)
  return auth
}

async function sendEmail({ to, subject, body }) {
  const credentials = getCredentials()
  const auth = buildAuthClient(credentials)
  const gmail = google.gmail({ version: 'v1', auth })

  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ].join('\r\n')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(raw).toString('base64url') }
  })
}

module.exports = { sendEmail }
