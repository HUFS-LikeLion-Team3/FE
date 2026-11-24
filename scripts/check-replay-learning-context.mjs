// Exercises the real Replay loader with isolated transport stubs, no network.
import ts from 'typescript'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const dataModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const stubUrl = dataModule(`
export const control = { newsCalls: 0, feedbackCalls: 0, failNews: false, status: 'completed', revealed: true }
export class ApiError extends Error {}
export const replayLearningApi = { session: async id => ({ id, newsId: '22222222-2222-4222-8222-222222222222', sessionType: 'replay', status: control.status, resultsRevealedAt: control.revealed ? '2026-11-20T00:00:00Z' : null }) }
export async function getReplayNews() { control.newsCalls++; if (control.failNews) throw new Error('unavailable'); return { title: '과거 연준 금리 결정' } }
export async function loadSessionFeedback(result) { control.feedbackCalls++; result.feedback = { learningNews: result.news }; result.feedbackState = 'ready' }
export const formatTime = x => x
export const loadPredictionDraft = () => ({})
export const toTarget = x => x
export const replayFeedbackHref = () => ''
export const replayPrompts = []
`)
const { control } = await import(stubUrl)
const source = fs.readFileSync(new URL('../src/features/replay/session-api.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const isolated = compiled.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => 'from ' + JSON.stringify(specifier === 'zod' ? import.meta.resolve('zod') : stubUrl))
const { loadReplayFeedback } = await import(dataModule(isolated))
const id = '11111111-1111-4111-8111-111111111111'
const saved = { targets: [], draft: {}, sessionTargets: [] }
const initial = await loadReplayFeedback(id, 'initial', undefined, saved)
assert.equal(initial.feedback.learningNews.title, '과거 연준 금리 결정')
assert.deepEqual(initial.feedback.learningNews.facts, [])
await loadReplayFeedback(id, 'final', undefined, initial.saved)
assert.equal(control.newsCalls, 1, 'Reuse news context across feedback polls')
control.failNews = true
const fallback = await loadReplayFeedback(id, 'initial', undefined, saved)
assert.equal(fallback.feedbackState, 'ready')
assert.equal(fallback.feedback.learningNews, undefined)
const feedbackCalls = control.feedbackCalls, newsCalls = control.newsCalls
control.revealed = false
const hidden = await loadReplayFeedback(id, 'final', undefined, saved)
assert.equal(hidden.feedback, null)
assert.equal(control.feedbackCalls, feedbackCalls)
assert.equal(control.newsCalls, newsCalls)
control.revealed = true
const abort = new AbortController()
abort.abort()
await assert.rejects(loadReplayFeedback(id, 'initial', abort.signal, saved), { name: 'AbortError' })
assert.equal(control.feedbackCalls, feedbackCalls)
console.log('Replay news context, cache, fallback, disclosure and cancellation checks passed')
