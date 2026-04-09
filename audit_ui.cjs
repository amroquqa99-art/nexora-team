const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const uiDir = 'c:\\عمرو\\انتي جرافتي\\Nexora\\src\\components\\ui';
const srcDir = 'c:\\عمرو\\انتي جرافتي\\Nexora\\src';
const nodePath = 'c:\\عمرو\\انتي جرافتي\\Nexora\\.node\\node.exe';

const files = fs.readdirSync(uiDir);
const unusedFiles = [];

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const componentName = path.basename(file, path.extname(file));
    // Convert kebab-case to PascalCase for searching if needed, 
    // but usually searching for the file name string is enough for exports/imports.
    const searchString = componentName.charAt(0).toUpperCase() + componentName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    try {
      // Search in src excluding components/ui
      // Using power shell since we are on windows
      const command = `Get-ChildItem -Path "${srcDir}" -Recurse -Exclude "ui" | Select-String -Pattern "${searchString}" -Quiet`;
      const result = execSync(`powershell -Command "${command}"`).toString().trim();
      
      if (result === 'False') {
        unusedFiles.push(file);
      }
    } catch (e) {
      console.error(`Error searching for ${searchString}:`, e.message);
    }
  }
});

console.log('Unused UI files found:');
console.log(JSON.stringify(unusedFiles, null, 2));
