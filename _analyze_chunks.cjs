const fs = require('fs');
const index = fs.readFileSync('dist/assets/index-S2LAMB0B.js', 'utf-8');
const wp = fs.readFileSync('dist/assets/WatchPage-B4FekYlI.js', 'utf-8');
const ui = fs.readFileSync('dist/assets/shared-ui-vzh2v1NU.js', 'utf-8');
const vr = fs.readFileSync('dist/assets/vendor-react-CcXhxxS7.js', 'utf-8');

// shared-core export map
const exportMap = {
  a: { internal: 'ut', name: 'getMovieById', source: 'src/appwrite.js' },
  c: { internal: 'lt', name: 'updateSearchCount', source: 'src/appwrite.js' },
  i: { internal: 'ft', name: 'jsx/jsxs factory', source: 'react/jsx-runtime' },
  l: { internal: 'ae', name: 'HelmetProvider', source: 'react-helmet-async' },
  n: { internal: 'mt', name: 'AuthProvider', source: 'src/context/AuthContext.jsx' },
  o: { internal: 'st', name: 'loadAdminConfig', source: 'src/appwrite.js' },
  r: { internal: 'ht', name: 'useAuth', source: 'src/context/AuthContext.jsx' },
  s: { internal: 'ct', name: 'saveAdminConfig', source: 'src/appwrite.js' },
  t: { internal: 'xt', name: 'SEO (default)', source: 'src/components/SEO.jsx' },
  u: { internal: 'r', name: '__CLIENT_INTERNALS (W in shared-core)', source: 'react/cjs/react.production.js' },
};

function extractImports(content, chunkName) {
  const re = /import\{([^}]+)\}from"[^"]*"/g;
  const results = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    if (m[0].includes(chunkName)) {
      results.push(m[1]);
    }
  }
  return results.length > 0 ? results[0].split(',').map(i => i.trim()) : [];
}

console.log('=== Index imports from shared-core ===');
const idx = extractImports(index, 'shared-core');
idx.forEach(i => {
  const parts = i.split(/\s+as\s+/);
  const remote = parts[0], local = parts[parts.length - 1];
  const ex = exportMap[remote];
  console.log('  ' + local + ' (=export ' + remote + ') -> ' + (ex ? ex.name : 'UNKNOWN'));
});

console.log('\n=== WatchPage imports from shared-core ===');
const wpImports = extractImports(wp, 'shared-core');
wpImports.forEach(i => {
  const parts = i.split(/\s+as\s+/);
  const remote = parts[0], local = parts[parts.length - 1];
  const ex = exportMap[remote];
  console.log('  ' + local + ' (=export ' + remote + ') -> ' + (ex ? ex.name : 'UNKNOWN'));
});

console.log('\n=== shared-ui imports from shared-core ===');
const uiImports = extractImports(ui, 'shared-core');
uiImports.forEach(i => {
  const parts = i.split(/\s+as\s+/);
  const remote = parts[0], local = parts[parts.length - 1];
  const ex = exportMap[remote];
  console.log('  ' + local + ' (=export ' + remote + ') -> ' + (ex ? ex.name : 'UNKNOWN'));
});

console.log('\n=== vendor-react imports from shared-core ===');
const vrImports = extractImports(vr, 'shared-core');
vrImports.forEach(i => {
  const parts = i.split(/\s+as\s+/);
  const remote = parts[0], local = parts[parts.length - 1];
  const ex = exportMap[remote];
  console.log('  ' + local + ' (=export ' + remote + ') -> ' + (ex ? ex.name : 'UNKNOWN'));
});

// Also check the shared-ui export to understand what the index chunk imports from it
const uiExports = ui.match(/export\{[^}]+\}/);
console.log('\n=== shared-ui exports ===');
console.log(uiExports ? uiExports[0] : 'none');

// Check index imports from shared-ui
console.log('\n=== Index imports from shared-ui ===');
const idxUi = extractImports(index, 'shared-ui');
idxUi.forEach(i => console.log('  ' + i));