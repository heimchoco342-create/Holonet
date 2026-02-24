// Postinstall script to ensure electron binaries are installed
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron');
const distPath = path.join(electronPath, 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron');
const installJsPath = path.join(electronPath, 'install.js');

// Check if electron is installed but binaries are missing
if (fs.existsSync(electronPath) && !fs.existsSync(distPath) && fs.existsSync(installJsPath)) {
  console.log('Electron binaries not found. Running install.js...');
  try {
    execSync('node install.js', {
      cwd: electronPath,
      stdio: 'inherit'
    });
    console.log('Electron binaries installed successfully.');
  } catch (error) {
    console.error('Failed to install electron binaries:', error.message);
    process.exit(1);
  }
} else if (!fs.existsSync(electronPath)) {
  console.log('Electron not found in node_modules. It will be installed by pnpm.');
} else if (fs.existsSync(distPath)) {
  console.log('Electron binaries already installed.');
}
