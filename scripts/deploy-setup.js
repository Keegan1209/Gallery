#!/usr/bin/env node

/**
 * Deployment Setup Script
 * 
 * This script handles database migrations and setup for production deployment.
 * Run this after deploying to ensure the database schema is up to date.
 */

const { execSync } = require('child_process');

async function runDeploymentSetup() {
  console.log('🚀 Starting deployment setup...');
  
  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push database schema
    console.log('🗄️  Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Deployment setup completed successfully!');
    console.log('');
    console.log('Your application is ready with:');
    console.log('- ✅ Database schema updated');
    console.log('- ✅ Prisma client generated');
    console.log('- ✅ Diary entries will be stored in Supabase');
    
  } catch (error) {
    console.error('❌ Deployment setup failed:', error.message);
    console.log('');
    console.log('Manual steps to fix:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma db push');
    console.log('3. Check your DATABASE_URL in .env');
    process.exit(1);
  }
}

runDeploymentSetup();