require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
app.use(express.json());

app.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || latitude == null || longitude == null)
    return res.status(400).json({ error: 'All fields required' });
  if (typeof latitude !== 'number' || typeof longitude !== 'number')
    return res.status(400).json({ error: 'Latitude and Longitude must be numbers' });

  try {
    const [result] = await db.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: 'School added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/listSchools', async (req, res) => {
  const lat = parseFloat(req.query.userLat);
  const long = parseFloat(req.query.userLong);
  if (isNaN(lat) || isNaN(long))
    return res.status(400).json({ error: 'Valid latitude and longitude required' });

  try {
    const [schools] = await db.execute('SELECT * FROM schools');
    const distance = (lat1, lon1, lat2, lon2) => {
      const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    schools.forEach(s => s.distance = distance(lat, long, s.latitude, s.longitude));
    schools.sort((a,b) => a.distance - b.distance);
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
