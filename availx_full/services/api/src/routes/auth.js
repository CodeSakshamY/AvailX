const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateToken } = require('../middleware/auth');
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, password, role, email } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'missing_fields' });
    const existing = await prisma.user.findUnique({ where: { phone }});
    if (existing) return res.status(400).json({ error: 'user_exists' });
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const user = await prisma.user.create({ data: { name, phone, email, passwordHash: hash, role: role || 'CUSTOMER' } });
    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role }, token });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) return res.status(400).json({ error: 'missing_phone' });
    const user = await prisma.user.findUnique({ where: { phone }});
    if (!user) return res.status(400).json({ error: 'no_user' });
    if (user.passwordHash) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'invalid_creds' });
    }
    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role }, token });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
module.exports = router;
