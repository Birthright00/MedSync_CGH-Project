#!/usr/bin/env node

/**
 * Setup Verification Script for CGH Project
 * 
 * This script checks if all required dependencies are installed
 * and provides helpful feedback for setup issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CGH Project Setup Verification\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkPassed(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

// Check Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    checkPassed(`Node.js version: ${nodeVersion}`);
  } else {
    checkWarning(`Node.js version ${nodeVersion} is below recommended (16+)`);
  }
} catch (error) {
  checkFailed('Could not determine Node.js version');
}

// Check if package.json exists
if (fs.existsSync('package.json')) {
  checkPassed('package.json found');
} else {
  checkFailed('package.json not found - are you in the project root?');
}

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  checkPassed('Frontend node_modules directory exists');
} else {
  checkFailed('Frontend node_modules not found - run: npm install');
}

// Check backend structure
if (fs.existsSync('backend/package.json')) {
  checkPassed('Backend package.json found');
} else {
  checkFailed('Backend package.json not found');
}

if (fs.existsSync('backend/node_modules')) {
  checkPassed('Backend node_modules directory exists');
} else {
  checkFailed('Backend node_modules not found - run: cd backend && npm install');
}

// Check for critical dependencies
const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'msal', 'express'];

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  criticalDeps.forEach(dep => {
    if (dependencies[dep]) {
      checkPassed(`Critical dependency ${dep} found in package.json`);
    } else {
      checkFailed(`Critical dependency ${dep} missing from package.json`);
    }
  });
} catch (error) {
  checkFailed('Could not read package.json');
}

// Check if MSAL is actually installed
try {
  require.resolve('msal');
  checkPassed('MSAL package is installed and accessible');
} catch (error) {
  checkFailed('MSAL package not found - this was the original issue!');
  console.log('   Run: npm install');
}

// Check backend dependencies
try {
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const backendDeps = Object.keys(backendPackageJson.dependencies || {});
  
  if (backendDeps.length > 0) {
    checkPassed(`Backend has ${backendDeps.length} dependencies configured`);
  } else {
    checkWarning('Backend package.json has no dependencies');
  }
} catch (error) {
  checkFailed('Could not read backend/package.json');
}

// Check for important files
const importantFiles = [
  'src/App.js',
  'src/index.js', 
  'backend/server.js',
  'public/index.html'
];

importantFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checkPassed(`Important file ${file} exists`);
  } else {
    checkFailed(`Important file ${file} missing`);
  }
});

// Summary
console.log('\n📊 Setup Verification Summary:');
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 Setup looks good! You should be able to run: npm start');
} else {
  console.log('\n🔧 Setup issues detected. Please address the failed checks above.');
  console.log('\nQuick fixes:');
  console.log('   npm install                    # Install frontend dependencies');
  console.log('   cd backend && npm install      # Install backend dependencies');
  console.log('   npm run setup                  # Install both at once');
  console.log('   npm run clean-install          # Clean install if issues persist');
}

if (checks.warnings > 0) {
  console.log('\n⚠️  Warnings detected - consider addressing these for optimal setup.');
}

console.log('\nFor detailed setup instructions, see: SETUP.md');
console.log('For dependency information, see: DEPENDENCIES.md');