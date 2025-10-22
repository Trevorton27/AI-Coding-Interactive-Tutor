// scripts/generate-types.ts
// Generate TypeScript types from Prisma schema

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔧 Generating types from Prisma schema...');

try {
  // Generate Prisma client
  execSync('pnpm --filter @aict/web prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma types generated');
  
  // Optionally copy types to shared location
  const sourceTypes = path.join(__dirname, '../node_modules/.prisma/client/index.d.ts');
  const targetTypes = path.join(__dirname, '../packages/services/src/prisma-types.d.ts');
  
  if (fs.existsSync(sourceTypes)) {
    fs.copyFileSync(sourceTypes, targetTypes);
    console.log('✅ Types copied to packages/services/src/');
  }
  
} catch (error) {
  console.error('❌ Type generation failed:', error);
  process.exit(1);
}