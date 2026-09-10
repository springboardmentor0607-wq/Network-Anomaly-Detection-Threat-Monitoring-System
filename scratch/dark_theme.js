const fs = require('fs');
const path = require('path');

const mappings = {
  // Revert Backgrounds
  'bg-white': 'bg-[#111827]',
  'bg-gray-50': 'bg-[#0B0F17]',
  'bg-gray-100': 'bg-[#1E293B]',
  
  // Revert Text colors
  'text-gray-900': 'text-white',
  'text-gray-800': 'text-gray-200',
  'text-gray-700': 'text-gray-300',
  'text-gray-600': 'text-gray-400',
  
  // Revert Hover states
  'hover:bg-gray-100': 'hover:bg-[#1E293B]',
  'hover:text-gray-900': 'hover:text-white',
  'hover:border-gray-300': 'hover:border-gray-700',
  
  // Revert Borders
  'border-gray-200': 'border-[#1F2937]',
  'border-gray-300': 'border-gray-700',
  
  // Revert Specific tweaks
  'border-red-500/50': 'border-red-500/30',
  'text-cyan-700': 'text-cyan-400',
  'text-cyan-600': 'text-cyan-300',
  'bg-cyan-50': 'bg-cyan-950/40',
  'text-red-600': 'text-red-400',
  'text-amber-600': 'text-amber-400',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./frontend/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Process longer keys first to avoid partial replacements
    const keys = Object.keys(mappings).sort((a, b) => b.length - a.length);
    
    keys.forEach(key => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, mappings[key]);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Reverted ${filePath}`);
    }
  }
});
