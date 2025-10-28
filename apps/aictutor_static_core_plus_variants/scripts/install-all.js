#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Finding all package.json files...\n');

let total = 0;
let success = 0;
let failed = 0;

function findPackageJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.next') {
        findPackageJsonFiles(filePath, fileList);
      }
    } else if (file === 'package.json') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function installDependencies(packagePath) {
  const dir = path.dirname(packagePath);
  const relativePath = path.relative(process.cwd(), dir);

  total++;
  console.log(`\n📦 Installing dependencies in: ${relativePath}`);

  try {
    execSync('npm install', {
      cwd: dir,
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    
    success++;
    console.log(`✅ Success: ${relativePath}`);
    return true;
  } catch (error) {
    failed++;
    console.error(`❌ Failed: ${relativePath}`);
    return false;
  }
}

// Main execution
const rootDir = process.cwd();
const packageFiles = findPackageJsonFiles(rootDir);

console.log(`Found ${packageFiles.length} package.json file(s)\n`);

packageFiles.forEach(installDependencies);

// Summary
console.log('\n================================');
console.log('📊 Installation Summary');
console.log('================================');
console.log(`Total: ${total}`);
console.log(`Success: ${success}`);
console.log(`Failed: ${failed}\n`);

if (failed === 0) {
  console.log('🎉 All installations completed successfully!');
  process.exit(0);
} else {
  console.error('⚠️  Some installations failed. Check the logs above.');
  process.exit(1);
}