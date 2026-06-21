const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { email: true, role: true }, take: 10 })
  .then(r => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); })
  .catch(e => { console.error('HATA:', e.message); return p.$disconnect(); });
