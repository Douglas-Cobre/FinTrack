const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
  const exported = {};
  new Function('exports', 'require', code)(exported, name => {
    if (!(name in dependencies)) throw new Error(`Dependencia inesperada: ${name}`);
    return dependencies[name];
  });
  return exported;
}

for (const base of ['http://localhost:8080/api', '/api']) {
  const api = load('core/api/api-url.ts', { '../../../environments/environment': { environment: { apiUrl: base } } });
  const origin = 'https://fintrack.example.com';
  const target = new URL(base, origin).href;
  assert.equal(api.pertenceAApi(target + '/movimentacoes', origin), true);
  assert.equal(api.pertenceAApi(target + '?pagina=1', origin), true);
  assert.equal(api.pertenceAApi(target + '-externa', origin), false);
  assert.equal(api.pertenceAApi('https://outro.example.com/api', origin), false);
  assert.equal(api.pertenceAApi(new URL('/outro', target).href, origin), false);
  assert.equal(api.apiUrl('/categorias'), base + '/categorias');
}
const { mensagemErro } = load('shared/mensagem-erro.ts');
assert.match(mensagemErro({ status: 0 }, 'fallback'), /conexão/);
assert.match(mensagemErro({ status: 401 }, 'fallback'), /sessão/);
assert.equal(mensagemErro({ status: 409, error: { mensagem: 'Categoria vinculada.' } }, 'fallback'), 'Categoria vinculada.');
assert.equal(mensagemErro({ status: 400, error: { campos: { nome: 'obrigatório' } } }, 'fallback'), 'nome: obrigatório');
assert.doesNotMatch(mensagemErro({ status: 500, error: { mensagem: 'detalhe privado' } }, 'fallback'), /privado/);
console.log('API: fronteira do token em desenvolvimento/producao e mensagens de erro passaram.');
