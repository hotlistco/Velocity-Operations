CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('wizard', 'apprentice')),
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_number TEXT NOT NULL UNIQUE,
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  job_description TEXT,
  short_description TEXT,
  special_services TEXT,
  due_date DATE,
  priority_level INTEGER NOT NULL DEFAULT 5 CHECK(priority_level BETWEEN 1 AND 10),
  delivery_required INTEGER NOT NULL DEFAULT 0,
  physical_location TEXT,
  shelf_status TEXT NOT NULL DEFAULT 'INCOMING' CHECK(shelf_status IN ('INCOMING', 'OUTGOING')),
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  deliverable_path TEXT,
  materials_needed TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL UNIQUE CHECK(type IN ('overdue', 'complete')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS update_work_order_timestamp
  AFTER UPDATE ON work_orders
  BEGIN
    UPDATE work_orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

INSERT OR IGNORE INTO email_templates (type, subject, body) VALUES
  ('overdue',
   'Important: Your Order Is Past Due — {{job_description}}',
   'Dear {{client_name}},

We are reaching out regarding your order for {{job_description}}, which was due on {{due_date}}. We understand your time is valuable and want to address this promptly.

Please contact us at your earliest convenience so we can assist you in completing or rescheduling your order.

Thank you,
The Team'),
  ('complete',
   'Your Order Is Ready for Pickup — {{job_description}}',
   'Dear {{client_name}},

Great news! Your order for {{job_description}} is complete and ready for pickup.

Please visit us at your convenience during business hours. If you have any questions, don''t hesitate to reach out.

Thank you for your business,
The Team');

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('alert_threshold_days', '3'),
  ('shop_name', 'The Shop'),
  ('shop_email', '');
