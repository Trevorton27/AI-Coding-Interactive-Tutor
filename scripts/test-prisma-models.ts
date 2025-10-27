import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log('Available Prisma models:', models);
console.log('Has Challenge model?', 'challenge' in prisma);
console.log('Has Task model?', 'task' in prisma);

prisma.$disconnect();
