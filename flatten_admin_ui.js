const fs = require('fs');
const path = require('path');

const directories = [
  'C:/عمرو/انتي جرافتي/Nexora/src/features/admin/components',
  'C:/عمرو/انتي جرافتي/Nexora/src/pages'
];

function flattenFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace heavy visual classes
  content = content.replace(/\bgateway-container\b/g, 'bg-black');
  content = content.replace(/\bglass-card-2\b/g, 'bg-[#0a0a0a] border border-white/5');
  content = content.replace(/\bglass-card\b/g, 'bg-[#0a0a0a] border border-white/5');
  content = content.replace(/\bglass-2\b/g, 'bg-[#0a0a0a] border border-white/5');
  content = content.replace(/\bglass\b/g, 'bg-transparent');
  content = content.replace(/\bbackdrop-blur-(sm|md|lg|xl|2xl|3xl)\b/g, '');
  content = content.replace(/\banimate-in fade-in slide-in-from-bottom-\d+\b/g, '');
  content = content.replace(/\bduration-[0-9]+\b/g, 'duration-100');
  content = content.replace(/\bshadow-\[.*?\]\b/g, '');
  content = content.replace(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/g, '');
  content = content.replace(/\btext-glow\b/g, '');
  content = content.replace(/\bneon-glow\b/g, '');
  content = content.replace(/\banimate-pulse\b/g, '');
  content = content.replace(/\bbg-black\/40\b/g, 'bg-[#0a0a0a]');
  content = content.replace(/\bbg-white\/[0-9]+\b/g, 'bg-[#111]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Flattened CSS for:', path.basename(filePath));
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.startsWith('Admin') && file.endsWith('.tsx')) {
        flattenFile(path.join(dir, file));
      }
    });
  }
});
