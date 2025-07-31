#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Loading environment variables from .env.local to Railway...');

// Read .env.local file from project root (one level up from scripts)
const envLocalPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('ERROR: .env.local file not found!');
  console.log('Create a .env.local file with your environment variables first.');
  console.log(`Expected location: ${envLocalPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envLines = envContent
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => line.trim());

if (envLines.length === 0) {
  console.log('WARNING: No environment variables found in .env.local');
  process.exit(0);
}

console.log(`Found ${envLines.length} environment variables to upload`);

// Parse all variables first
const variables = [];
for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  
  if (!key || value === undefined || value === '') {
    console.log(`SKIPPING invalid line: ${line}`);
    continue;
  }
  
  variables.push({ key, value });
}

if (variables.length === 0) {
  console.log('No valid variables to set');
  process.exit(0);
}

console.log('Setting all variables at once (no deployments triggered)...');

try {
  // Build command with all variables and --skip-deploys flag
  const setFlags = variables.map(v => `--set "${v.key}=${v.value}"`).join(' ');
  const command = `railway variables ${setFlags} --skip-deploys`;
  
  console.log(`Executing command with ${variables.length} variables...`);
  execSync(command, { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log('SUCCESS: All environment variables set!');
  console.log('\nNext steps:');
  console.log('1. Deploy: railway up');
  console.log('2. Get URL: railway domain');
  console.log('3. View logs: railway logs');
  
} catch (error) {
  console.error('FAILED to set variables in batch. Error:', error.message);
  console.log('\nFallback: Set variables via Railway web interface');
  console.log('1. Go to: https://railway.com/project/ea83871e-2e29-4ff6-9bfc-2b3878d6d919');
  console.log('2. Click your service');
  console.log('3. Go to Variables tab');
  console.log('4. Add these variables:');
  console.log('');
  variables.forEach(v => {
    console.log(`   ${v.key}=${v.value}`);
  });
} 