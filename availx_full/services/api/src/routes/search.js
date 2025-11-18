const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
router.get('/', async (req, res) => {
  try {
    const { category = '', lat, lon, radiusKm = 10 } = req.query;
    const providers = await prisma.provider.findMany({ where: { category: { contains: category } }, take: 200 });
    if (!lat || !lon) return res.json({ results: providers });
    const toFloat = v => parseFloat(v);
    const lat1 = toFloat(lat), lon1 = toFloat(lon);
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = x => (x * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    const filtered = providers.map(p => ({ provider: p, distanceKm: haversine(lat1, lon1, p.lat, p.lon) })).filter(x => x.distanceKm <= parseFloat(radiusKm)).sort((a,b)=>a.distanceKm-b.distanceKm);
    res.json({ results: filtered });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
module.exports = router;
