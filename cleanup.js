const fs = require('fs');
const path = require('path');

// Preserving the SQL files so judges can review your database schema!
const FILES_TO_DELETE = [
  'SUBMISSION_REPORT_PREP.md',
  'SUBMISSION_DETAILS.md',
  'SUPABASE_GUIDE.md'
];

function stripComments(code, isCss = false) {
  let result = code.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

  let inString = null;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let cleanCode = '';
  let i = 0;
  
  while (i < result.length) {
    let char = result[i];
    let nextChar = result[i + 1];
    
    if (inSingleLineComment) {
      if (char === '\n' || char === '\r') {
        inSingleLineComment = false;
        cleanCode += char;
      }
      i++;
      continue;
    }
    
    if (inMultiLineComment) {
      if (char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    
    if (inString) {
      if (char === '\\') {
        cleanCode += char + (nextChar || '');
        i += 2;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      cleanCode += char;
      i++;
      continue;
    }
    
    if (!isCss && char === '/' && nextChar === '/') {
      inSingleLineComment = true;
      i += 2;
      continue;
    }
    
    if (char === '/' && nextChar === '*') {
      inMultiLineComment = true;
      i += 2;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      cleanCode += char;
      i++;
      continue;
    }
    
    cleanCode += char;
    i++;
  }
  
  return cleanCode;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(filePath);
      }
    } else {
      const ext = path.extname(filePath);
      if (ext === '.js' || ext === '.jsx' || ext === '.css') {
        console.log(`- Cleared comments in: ${path.relative(process.cwd(), filePath)}`);
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const strippedContent = stripComments(originalContent, ext === '.css');
        fs.writeFileSync(filePath, strippedContent, 'utf8');
      }
    }
  }
}

console.log('\n======================================================');
console.log('   PERFORMX REPOSITORY CLEANUP & CODE HARDENING');
console.log('======================================================\n');

console.log('1. Deleting files not needed for the live application...');
for (const file of FILES_TO_DELETE) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`   [DELETED] ${file}`);
  } else {
    console.log(`   [SKIP] ${file} (Not found or already deleted)`);
  }
}

// Delete the empty 'server' directory if it exists
const serverDirPath = path.join(process.cwd(), 'server');
if (fs.existsSync(serverDirPath)) {
  try {
    fs.rmdirSync(serverDirPath);
    console.log('   [DELETED] Empty server directory');
  } catch (err) {
    console.log('   [SKIP] Could not delete server directory:', err.message);
  }
}

console.log('\n2. Securing configuration files...');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  let content = fs.readFileSync(gitignorePath, 'utf8');
  if (!content.includes('.env')) {
    content += '\n\n# Secure Local Credentials\n.env\n.env.production\n';
    fs.writeFileSync(gitignorePath, content, 'utf8');
    console.log('   [SECURED] Added .env exclusion to .gitignore to protect Supabase keys!');
  } else {
    console.log('   [OK] .env already excluded in .gitignore');
  }
}

console.log('\n3. Processing codebase and stripping comments...');
const srcPath = path.join(process.cwd(), 'src');
if (fs.existsSync(srcPath)) {
  processDirectory(srcPath);
}

console.log('\n4. Cleaning configuration files...');
const CONFIG_FILES = ['vite.config.js', 'tailwind.config.js', 'eslint.config.js', 'postcss.config.js'];
for (const file of CONFIG_FILES) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   - Cleared comments in config: ${file}`);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const strippedContent = stripComments(originalContent, false);
    fs.writeFileSync(filePath, strippedContent, 'utf8');
  }
}

// Delete this script itself at the end so it leaves no trace!
const selfPath = __filename;
try {
  setTimeout(() => {
    if (fs.existsSync(selfPath)) {
      fs.unlinkSync(selfPath);
      console.log('\n   [CLEANUP] Automatically removed cleanup.js to leave zero trace!');
      console.log('\n=== WORKSPACE HAS BEEN FULLY POLISHED & CLEANED ===\n');
    }
  }, 100);
} catch (e) {
  // Let user delete manually if self-deletion fails
}
