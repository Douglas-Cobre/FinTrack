const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/app/shared/data-local.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
new Function('exports', code)(exported);
const originalTimezone = process.env.TZ;
try {
  process.env.TZ = 'America/Sao_Paulo';
  assert.equal(exported.dataLocal(new Date('2026-10-11T02:30:00Z')), '2026-10-10');
  assert.equal(exported.dataLocal(new Date('2027-01-01T01:30:00Z')), '2026-12-31');
  process.env.TZ = 'Asia/Tokyo';
  assert.equal(exported.dataLocal(new Date('2026-10-10T16:30:00Z')), '2026-10-11');
  console.log('Data local: 3 cenarios de fuso horario passaram.');
} finally {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
}
