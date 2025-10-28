import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const prismaPath = require.resolve('@prisma/client');
console.log('Prisma client path:', prismaPath);

const prisma = new PrismaClient();
const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log('\nAvailable models:', models);

prisma.$disconnect();
