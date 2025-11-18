const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth');
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { providerId, listingId, scheduledFor } = req.body;
    if (!providerId || !listingId || !scheduledFor) return res.status(400).json({ error: 'missing_fields' });
    const booking = await prisma.booking.create({ data: { userId: user.id, providerId, listingId, scheduledFor: new Date(scheduledFor), status: 'PENDING' } });
    res.json({ booking });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
router.post('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const bookingId = req.params.id;
    const { action } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }});
    if (!booking) return res.status(404).json({ error: 'not_found' });
    const provider = await prisma.provider.findUnique({ where: { id: booking.providerId }});
    if (!provider || provider.userId !== user.id) return res.status(403).json({ error: 'forbidden' });
    const status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status }});
    res.json({ booking: updated });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});
module.exports = router;
