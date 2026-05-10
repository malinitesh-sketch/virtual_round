const { createPool } = require('./mysql');

const pool = createPool();

async function listActivities(req, res){
  try{
    const tripId = req.query.tripId;

    if(!tripId){
      return res.status(400).json({ error: 'tripId query param required' });
    }

    const [rows] = await pool.execute(
      `SELECT id, stop_id, trip_id, day_index, name, type, start_time, end_time, cost, notes
       FROM activities
       WHERE trip_id = ?
       ORDER BY day_index, start_time`,
      [tripId]
    );

    return res.json({ activities: rows });
  }catch(err){
    return res.status(500).json({ error:'Failed to list activities', details:String(err?.message||err) });
  }
}

async function createActivity(req, res){
  try{
    const { tripId, stopId, dayIndex, name, type, startTime, endTime, cost, notes } = req.body || {};
    const parsedCost = cost === undefined || cost === null ? 0 : cost;

    if(!tripId || !dayIndex || !name){
      return res.status(400).json({ error:'tripId, dayIndex, name required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO activities
       (stop_id, trip_id, day_index, name, type, start_time, end_time, cost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [stopId || null, tripId, dayIndex, name, type || null, startTime || null, endTime || null, parsedCost, notes || null]
    );

    return res.status(201).json({ message:'Activity created', activityId: result.insertId });
  }catch(err){
    return res.status(500).json({ error:'Create activity failed', details:String(err?.message||err) });
  }
}

module.exports = { listActivities, createActivity };

