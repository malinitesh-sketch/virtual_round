const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { createPool } = require('./mysql');

const pool = createPool();

function signToken(user){
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res){
  try{
    const { firstName, lastName, name, email, password, profilePic } = req.body || {};
    const userName = (name || `${firstName || ''} ${lastName || ''}`).trim();

    if(!userName || !email || !password){
      return res.status(400).json({ error:'name, email, password required' });
    }
    if(!validator.isEmail(email)){
      return res.status(400).json({ error:'Invalid email' });
    }
    if(String(password).length < 6){
      return res.status(400).json({ error:'Password must be at least 6 characters' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, profile_pic) VALUES (?, ?, ?, ?, ?)',
      [userName, email.trim().toLowerCase(), password_hash, 'Traveler', profilePic || null]
    );

    return res.status(201).json({
      message:'User registered',
      userId: result.insertId,
      user: {
        id: result.insertId,
        name: userName,
        email: email.trim().toLowerCase(),
        role: 'Traveler',
        profilePic: profilePic || null
      },
      token: signToken({ id: result.insertId, email: email.trim().toLowerCase(), role: 'Traveler' })
    });
  }catch(err){
    // Duplicate email
    if(String(err && err.code).startsWith('ER_DUP_ENTRY')){
      return res.status(409).json({ error:'Email already exists' });
    }
    return res.status(500).json({ error:'Register failed', details: String(err?.message || err) });
  }
}

async function login(req, res){
  try{
    const { email, password } = req.body || {};
    if(!email || !password){
      return res.status(400).json({ error:'email and password required' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role, profile_pic FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if(!rows || rows.length === 0){
      return res.status(401).json({ error:'Invalid credentials' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok){
      return res.status(401).json({ error:'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      message:'Login success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profile_pic || null
      }
    });
  }catch(err){
    return res.status(500).json({ error:'Login failed', details: String(err?.message || err) });
  }
}

module.exports = { register, login };

