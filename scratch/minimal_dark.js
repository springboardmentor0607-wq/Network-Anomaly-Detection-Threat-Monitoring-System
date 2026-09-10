const fs = require('fs');
const path = require('path');

const mappings = {
  'bg-[#0B0F17]': 'bg-[#000000]',
  'bg-[#0F172A]': 'bg-[#0A0A0A]',
  'bg-[#111827]': 'bg-[#121212]',
  'bg-[#131C2E]': 'bg-[#1A1A1A]',
  'bg-[#1a1f2e]': 'bg-[#1A1A1A]',
  'bg-[#1E293B]': 'bg-[#222222]',
  'bg-[#1F2937]': 'bg-[#222222]',
  'bg-[#070A11]': 'bg-[#000000]',
  'border-[#1F2937]': 'border-[#333333]',
  'border-[#1E293B]': 'border-[#333333]',
  'border-[#374151]': 'border-[#444444]',
  'from-[#1F2937]': 'from-[#222222]',
  'to-[#111827]': 'to-[#121212]',
  'hover:bg-[#1E293B]': 'hover:bg-[#2A2A2A]',
  'hover:bg-[#131C2E]': 'hover:bg-[#2A2A2A]',
  'bg-[#131C2E]/60': 'bg-[#1A1A1A]/60',
  'bg-[#111827]/80': 'bg-[#121212]/80',
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
    
    // Replace hex color strings correctly
    const keys = Object.keys(mappings).sort((a, b) => b.length - a.length);
    
    keys.forEach(key => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, mappings[key]);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Applied minimal dark theme to ${filePath}`);
    }
  }
});
