const fs = require('fs');
const path = require('path');

const mappings = {
  // Backgrounds
  'bg-black': 'bg-gray-50',
  'bg-[#0B0F17]': 'bg-gray-50',
  'bg-[#0F172A]': 'bg-white',
  'bg-[#111827]': 'bg-white',
  'bg-[#131C2E]': 'bg-gray-50',
  'bg-[#1a1f2e]': 'bg-gray-50',
  'bg-[#1E293B]': 'bg-gray-100',
  
  // Text colors
  'text-white': 'text-gray-900',
  'text-gray-100': 'text-gray-900',
  'text-gray-200': 'text-gray-800',
  'text-gray-300': 'text-gray-700',
  'text-gray-400': 'text-gray-600',
  
  // Hover states
  'hover:bg-[#1E293B]': 'hover:bg-gray-100',
  'hover:text-white': 'hover:text-gray-900',
  'hover:bg-[#131C2E]': 'hover:bg-gray-100',
  'hover:border-gray-700': 'hover:border-gray-300',
  
  // Borders
  'border-[#1F2937]': 'border-gray-200',
  'border-gray-700': 'border-gray-300',
  
  // Specific tweaks
  'border-red-500/30': 'border-red-500/50',
  'text-cyan-400': 'text-cyan-700',
  'text-cyan-300': 'text-cyan-600',
  'bg-cyan-950/40': 'bg-cyan-50',
  'border-cyan-500/60': 'border-cyan-500',
  'text-red-400': 'text-red-600',
  'text-amber-400': 'text-amber-600',
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
    
    // Reverse sort to avoid partial matches (e.g., hover:text-white matching text-white)
    // Actually, for simple exact string replacement without regex, order matters.
    const keys = Object.keys(mappings).sort((a, b) => b.length - a.length);
    
    keys.forEach(key => {
      // Use regex to ensure we replace all occurrences
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, mappings[key]);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
