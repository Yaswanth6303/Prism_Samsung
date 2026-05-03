const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const files = getFiles('app/api').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('await auth()')) {
    const updated = content.replace(/await auth\(\)/g, "await auth.api.getSession({ headers: request.headers })");
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Fixed ' + file);
  }
});
