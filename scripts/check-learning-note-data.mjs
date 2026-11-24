// Existing TypeScript dependency only; no new test runner or network calls.
import ts from 'typescript'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const source = fs.readFileSync(new URL('../src/features/learning/learning-note-data.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { exportComposition } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const fact = (label, value, unit = '억 달러', asOf = '2026-11-20') => ({ id: label, label, value, unit, asOf })
const total = fact('수출액', '774'), part = fact('반도체 수출액', '385')
const news = facts => ({ title: '11월 1~20일 수출', facts })
assert.equal(exportComposition(news([total, part])).percent, '49.7')
for (const facts of [[total], [total, part, part], [total, { ...part, unit: '백만 달러' }], [total, { ...part, asOf: '2026-10-20' }], [total, { ...part, value: '385%' }], [{ ...total, value: '0' }, part], [total, { ...part, value: '800' }], [total, { ...part, asOf: null }]]) assert.equal(exportComposition(news(facts)), null)
assert.equal(exportComposition({ ...news([total, part]), title: '연준 정책금리' }), null)
console.log('10 offline calculation checks passed')
