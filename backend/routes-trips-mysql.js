const { createPool } = require('./mysql');

const pool = createPool();

async function listTrips(req, res){
  try{
    const userId = req.user?.id;

    // If no auth, return latest trips (prototype friendly)
    if(!userId){
      const [rows] = await pool.execute(
        'SELECT id, title, destination, start_date, end_date, description, status, budget, spent, cities, cover_url FROM trips ORDER BY id DESC LIMIT 10'
      );
      return res.json({ trips: rows.map(r => ({
        id: r.id,
        title: r.title,
        destination: r.destination,
        description: r.description,
        status: r.status,
        budget: r.budget,
        spent: r.spent,
        cities: r.cities,
        coverUrl: r.cover_url,
        startDate: r.start_date,
        endDate: r.end_date
      })) });
    }

    const [rows] = await pool.execute(
      'SELECT id, title, destination, start_date, end_date, description, status, budget, spent, cities, cover_url FROM trips WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    return res.json({ trips: rows.map(r => ({
      id: r.id,
      title: r.title,
      destination: r.destination,
      description: r.description,
      status: r.status,
      budget: r.budget,
      spent: r.spent,
      cities: r.cities,
      coverUrl: r.cover_url,
      startDate: r.start_date,
      endDate: r.end_date
    })) });
  }catch(err){
    return res.status(500).json({ error:'Failed to list trips', details: String(err?.message || err) });
  }
}

async function createTrip(req, res){
  try{
    const { title, destination, startDate, endDate, description, budget, cities, status } = req.body || {};
    const userId = req.user?.id;

    if(!userId){
      return res.status(401).json({ error:'Unauthorized' });
    }
    if(!title || !startDate || !endDate){
      return res.status(400).json({ error:'title, startDate, endDate required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO trips (user_id, title, destination, start_date, end_date, description, status, budget, spent, cities, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, String(title).trim(), destination || null, startDate, endDate, description || null, status || 'upcoming', budget || 0, 0, cities || 1, null]
    );

    return res.status(201).json({ message:'Trip created', tripId: result.insertId });
  }catch(err){
    return res.status(500).json({ error:'Create trip failed', details: String(err?.message || err) });
  }
}

module.exports = { listTrips, createTrip };

