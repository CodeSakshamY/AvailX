const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth');
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'unauth' });
    const { name, category, description, lat, lon, address } = req.body;
    const provider = await prisma.provider.create({ data: { userId: user.id, name: name || user.name, category, description, lat: parseFloat(lat)||0, lon: parseFloat(lon)||0, address } });
    res.json({ provider });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const provider = await prisma.provider.findUnique({ where: { id }, include: { listings: true }});
  if (!provider) return res.status(404).json({ error: 'not_found' });
  res.json({ provider });
});
module.exports = router;
