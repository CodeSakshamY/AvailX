const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.deleteMany();
  await prisma.provider.deleteMany();
  const alice = await prisma.user.create({ data: { name: 'Alice Provider', phone: '9999000001', role: 'PROVIDER' } });
  const bob = await prisma.user.create({ data: { name: 'Bob Customer', phone: '9999000002', role: 'CUSTOMER' } });
  await prisma.provider.createMany({ data: [
    { userId: alice.id, name: 'Alice Repair Shop', category: 'Repair', lat: 26.8467, lon: 80.9462, address: 'Alambagh, Lucknow' },
    { userId: alice.id, name: 'Alice Salon', category: 'Salon', lat: 26.8470, lon: 80.9470, address: 'Gomti Nagar, Lucknow' }
  ]});
  console.log('Seed done');
}
main().catch(e => console.error(e)).finally(() => process.exit());
