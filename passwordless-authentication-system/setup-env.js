#!/usr/bin/env node

/**
 * Environment Setup Script
 * Generates secure JWT secrets and creates .env files
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function createEnvFile(envPath, examplePath) {
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${envPath} already exists`);
    return;
  }

  if (!fs.existsSync(examplePath)) {
    console.error(`❌ ${examplePath} not found`);
    return;
  }

  let envContent = fs.readFileSync(examplePath, 'utf8');
  
  // Replace placeholder secrets with secure ones
  envContent = envContent.replace(
    'JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production',
    `JWT_ACCESS_SECRET=${generateSecureSecret()}`
  );
  
  envContent = envContent.replace(
    'JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production',
    `JWT_REFRESH_SECRET=${generateSecureSecret()}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath} with secure JWT secrets`);
}

function main() {
  console.log('🔧 Setting up environment files...\n');

  // Create server .env
  createEnvFile(
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), 'env.example')
  );

  // Create client .env
  createEnvFile(
    path.join(process.cwd(), 'client', '.env'),
    path.join(process.cwd(), 'client', 'env.example')
  );

  console.log('\n🎉 Environment setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update EMAIL_FROM, EMAIL_USER, and EMAIL_PASS in server/.env');
  console.log('2. Run: npm install (in both client and server directories)');
  console.log('3. Start the application with: start-dev.bat or start-dev.sh');
}

main();
