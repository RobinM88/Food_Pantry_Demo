/**
 * Script to validate environment variables before building
 * This ensures all required variables are present before starting production build
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Required environment variables for production build
 */
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_NAME',
  'VITE_APP_DESCRIPTION'
];

/**
 * Load environment variables from .env file
 */
function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      return {};
    }

    const envFileContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envFileContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value.replace(/^["'](.*)["']$/, '$1'); // Remove quotes
      }
    });

    return envVars;
  } catch (error) {
    console.error(`Error loading env file ${envPath}:`, error.message);
    return {};
  }
}

/**
 * Validate environment variables based on build mode
 */
function validateEnv() {
  const mode = process.env.NODE_ENV || 'development';
  const isProd = mode === 'production';
  
  console.log(`Validating environment variables for ${mode} mode...`);

  // Load environment variables from different files in priority order
  const envFiles = [
    path.join(rootDir, '.env'),
    path.join(rootDir, `.env.${mode}`),
    path.join(rootDir, '.env.local')
  ];

  let envVars = {};
  
  // Load and merge environment variables
  envFiles.forEach(filePath => {
    const vars = loadEnvFile(filePath);
    envVars = { ...envVars, ...vars };
  });

  // Add process.env variables as well
  envVars = { ...envVars, ...process.env };

  // Check for missing variables
  const missingVars = REQUIRED_ENV_VARS.filter(key => !envVars[key]);

  if (missingVars.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', `Error: Missing required environment variables:`, missingVars.join(', '));
    
    if (isProd) {
      console.error('\x1b[31m%s\x1b[0m', 'These variables are required for production builds. Exiting...');
      process.exit(1);
    } else {
      console.warn('\x1b[33m%s\x1b[0m', 'These variables are recommended but not required for development builds.');
    }
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Environment validation successful! All required variables are present.');
  }
}

validateEnv(); 