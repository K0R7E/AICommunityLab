/**
 * If NETLIFY_API_BASE_URL is set in Netlify (or CI), patch environment.ts before `ng build`
 * so the static site calls your deployed API. No trailing slash.
 * If unset, leaves environment.ts unchanged (empty apiBaseUrl → in-browser mock).
 */
const fs = require('fs');
const path = require('path');

const url = process.env.NETLIFY_API_BASE_URL;
if (!url || !String(url).trim()) {
  console.log(
    '[netlify-env] NETLIFY_API_BASE_URL not set — building with existing environment.ts',
  );
  process.exit(0);
}

const envPath = path.join(__dirname, '../src/environments/environment.ts');
let s = fs.readFileSync(envPath, 'utf8');
const escaped = String(url).trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const next = s.replace(/apiBaseUrl:\s*['"][^'"]*['"]/, `apiBaseUrl: '${escaped}'`);
if (next === s) {
  console.warn('[netlify-env] Could not find apiBaseUrl in environment.ts to patch.');
  process.exit(1);
}
fs.writeFileSync(envPath, next);
console.log('[netlify-env] apiBaseUrl set to:', url.trim());
