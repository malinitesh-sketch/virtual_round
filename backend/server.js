require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createPool } = require('./mysql');

const { authRequired } = require('./middleware-auth');
const authRoutes = require('./routes-auth-mysql');
const tripsRoutes = require('./routes-trips-mysql');
const activitiesRoutes = require('./routes-activities-mysql');

const pool = createPool();
const FRONTEND_DIR = path.join(__dirname, '../frontend');

const app = express();
const PORT = process.env.PORT || 5000;

function parseJsonField(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// ===== MIDDLEWARE =====
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500').split(',').map((origin) => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

app.use(express.static(FRONTEND_DIR));

// ===== ROUTES =====
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Traveloop Backend API is running',
    timestamp: new Date()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is connected to frontend!',
    data: { user: 'James A.', app: 'Traveloop' }
  });
});

// ===== API ROUTES (MySQL-backed) =====

// Auth
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// Trips
app.get('/api/trips', tripsRoutes.listTrips);
app.post('/api/trips', authRequired, tripsRoutes.createTrip);

// Activities
app.get('/api/activities', authRequired, activitiesRoutes.listActivities);
app.post('/api/activities', authRequired, activitiesRoutes.createActivity);

// User profile
app.get('/api/user/profile', authRequired, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, profile_pic, phone, city, country FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profile_pic || null,
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || ''
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch profile', details: String(err?.message || err) });
  }
});

app.put('/api/user/profile', authRequired, async (req, res) => {
  try {
    const { name, email, phone, city, country, profilePic } = req.body || {};
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email.trim().toLowerCase());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country);
    }
    if (profilePic !== undefined) {
      updates.push('profile_pic = ?');
      values.push(profilePic);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No profile fields provided' });
    }

    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, profile_pic, phone, city, country FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const user = rows[0];

    return res.json({ user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profile_pic || null,
      phone: user.phone || '',
      city: user.city || '',
      country: user.country || ''
    }});
  } catch (err) {
    return res.status(500).json({ error: 'Unable to update profile', details: String(err?.message || err) });
  }
});

// Trip details
app.get('/api/trips/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM trips WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch trip', details: String(err?.message || err) });
  }
});

app.put('/api/trips/:id', authRequired, async (req, res) => {
  try {
    const fields = ['title', 'destination', 'description', 'start_date', 'end_date', 'status', 'budget', 'spent', 'cities', 'cover_url'];
    const updates = [];
    const values = [];
    const body = req.body || {};

    fields.forEach((field) => {
      if (field in body) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ error: 'No trip fields provided for update' });
    }

    values.push(req.params.id);
    await pool.execute(`UPDATE trips SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.execute('SELECT * FROM trips WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found after update' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to update trip', details: String(err?.message || err) });
  }
});

app.delete('/api/trips/:id', authRequired, async (req, res) => {
  try {
    await pool.execute('DELETE FROM trips WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Trip deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to delete trip', details: String(err?.message || err) });
  }
});

app.get('/api/trips/:id/itinerary', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, trip_id, sections, days FROM itineraries WHERE trip_id = ? LIMIT 1', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    const record = rows[0];
    return res.json({
      id: record.id,
      tripId: record.trip_id,
      sections: parseJsonField(record.sections) || [],
      days: parseJsonField(record.days) || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch itinerary', details: String(err?.message || err) });
  }
});

// Community
app.get('/api/community', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, user_id, author, type, content, likes, comments, created_at FROM community_posts ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch community posts', details: String(err?.message || err) });
  }
});

app.post('/api/community', authRequired, async (req, res) => {
  try {
    const { type, content } = req.body || {};
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const [userRows] = await pool.execute('SELECT name FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const user = userRows[0];

    const author = user?.name || 'Traveler';
    const createdAt = new Date().toISOString();
    const [result] = await pool.execute(
      'INSERT INTO community_posts (user_id, author, type, content, likes, comments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, author, type || 'Post', content, 0, 0, createdAt]
    );

    return res.status(201).json({ id: result.insertId, userId: req.user.id, author, type: type || 'Post', content, likes: 0, comments: 0, createdAt });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to create community post', details: String(err?.message || err) });
  }
});

// Notes
app.get('/api/notes', async (req, res) => {
  try {
    let sql = 'SELECT id, trip_id, title, content, day, date, category FROM notes';
    const values = [];
    if (req.query.tripId) {
      sql += ' WHERE trip_id = ?';
      values.push(req.query.tripId);
    }
    sql += ' ORDER BY date DESC';
    const [rows] = await pool.execute(sql, values);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch notes', details: String(err?.message || err) });
  }
});

app.post('/api/notes', authRequired, async (req, res) => {
  try {
    const { tripId, title, content, day, date, category } = req.body || {};
    if (!tripId || !title) {
      return res.status(400).json({ error: 'tripId and title are required' });
    }

    const createdAt = new Date().toISOString();
    const [result] = await pool.execute(
      'INSERT INTO notes (trip_id, title, content, day, date, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tripId, title, content || '', day || 1, date || new Date().toISOString().slice(0, 10), category || 'General', createdAt]
    );

    return res.status(201).json({ id: result.insertId, tripId, title, content: content || '', day: day || 1, date: date || new Date().toISOString().slice(0, 10), category: category || 'General' });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to create note', details: String(err?.message || err) });
  }
});

// Invoices
app.get('/api/invoices', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, trip_id, trip_title, travelers, generated_date, status, subtotal, tax, discount, grand_total, budget_total, budget_spent, budget_remaining FROM invoices ORDER BY generated_date DESC');
    return res.json(rows.map((invoice) => ({ ...invoice, travelers: parseJsonField(invoice.travelers) || [] })));
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch invoices', details: String(err?.message || err) });
  }
});

app.get('/api/invoices/:invoiceId', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM invoices WHERE id = ? LIMIT 1', [req.params.invoiceId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = rows[0];
    invoice.travelers = parseJsonField(invoice.travelers) || [];
    invoice.items = parseJsonField(invoice.items) || [];
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch invoice', details: String(err?.message || err) });
  }
});

app.put('/api/invoices/:invoiceId/mark-paid', authRequired, async (req, res) => {
  try {
    await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', ['paid', req.params.invoiceId]);
    const [rows] = await pool.execute('SELECT * FROM invoices WHERE id = ? LIMIT 1', [req.params.invoiceId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = rows[0];
    invoice.travelers = parseJsonField(invoice.travelers) || [];
    invoice.items = parseJsonField(invoice.items) || [];
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to update invoice', details: String(err?.message || err) });
  }
});

// Checklists
app.get('/api/checklists', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, trip_id, trip_name, categories FROM checklists ORDER BY id DESC');
    return res.json(rows.map((checklist) => ({ ...checklist, categories: parseJsonField(checklist.categories) || [] })));
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch checklists', details: String(err?.message || err) });
  }
});

app.put('/api/checklists/:checklistId', authRequired, async (req, res) => {
  try {
    const { categories } = req.body || {};
    if (!categories) {
      return res.status(400).json({ error: 'Checklist categories are required' });
    }

    await pool.execute('UPDATE checklists SET categories = ? WHERE id = ?', [JSON.stringify(categories), req.params.checklistId]);
    const [rows] = await pool.execute('SELECT id, trip_id, trip_name, categories FROM checklists WHERE id = ? LIMIT 1', [req.params.checklistId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    const checklist = rows[0];
    return res.json({ ...checklist, categories: parseJsonField(checklist.categories) || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to update checklist', details: String(err?.message || err) });
  }
});

// Admin analytics
app.get('/api/admin/analytics', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [[userCount]] = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[tripCount]] = await pool.execute('SELECT COUNT(*) AS totalTrips FROM trips');
    const [cityRows] = await pool.execute('SELECT destination AS name, COUNT(*) AS count FROM trips WHERE destination IS NOT NULL GROUP BY destination ORDER BY count DESC LIMIT 4');
    const [[revenueRow]] = await pool.execute('SELECT COALESCE(SUM(grand_total), 0) AS revenue FROM invoices');
    const [activityRows] = await pool.execute('SELECT type AS name, COUNT(*) AS count FROM activities GROUP BY type ORDER BY count DESC LIMIT 4');
    const [trendRows] = await pool.execute("SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS value FROM trips GROUP BY month ORDER BY FIELD(month, 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')");

    return res.json({
      totalUsers: userCount.totalUsers,
      totalTrips: tripCount.totalTrips,
      citiesCovered: cityRows.length,
      revenue: Number(revenueRow.revenue),
      popularCities: cityRows.map((row) => ({ name: row.name, percentage: 100 })),
      popularActivities: activityRows.map((row) => ({ name: row.name, percentage: 100 })),
      monthlyTrends: trendRows.map((row) => ({ month: row.month, value: row.value }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch analytics', details: String(err?.message || err) });
  }
});

app.get('/api/admin/users', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const [rows] = await pool.execute('SELECT id, name, email, role, profile_pic FROM users ORDER BY created_at DESC');
    return res.json(rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profile_pic || null
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch users', details: String(err?.message || err) });
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ===== ERROR HANDLING =====
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     Traveloop Backend API              ║
║     Running on port ${PORT}             ║
║     Travel Beyond Gravity ✈️            ║
╚════════════════════════════════════════╝
  `);
  console.log(`API Documentation available at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
