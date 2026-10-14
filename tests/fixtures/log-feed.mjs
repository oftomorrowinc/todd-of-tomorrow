// A stand-in for signals' GET /api/log (job #944), after of-tomorrow-website's
// tests/fixtures/log-feed.mjs (job #946), so the build the specs run against
// reads a known feed. Run as a script it is a server on :4397 (PORT). It
// answers the way the real one does: newest first, ?scope (a prefix),
// ?person (404 when the person's stream is not served), ?since, ?limit,
// ?live=1, CORS *.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const fixture = JSON.parse(readFileSync(new URL('./log-feed.json', import.meta.url), 'utf8'));
const port = Number(process.env.PORT ?? 4397);
export const FEED_URL = `http://localhost:${port}/api/log`;

/** The feed's answer to a URL: { status, headers, body }. */
export function answer(href) {
	const url = new URL(href, FEED_URL);
	const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store', 'content-type': 'application/json' };
	const fail = (status, message) => ({ status, headers, body: JSON.stringify({ error: { code: 'not_found', message } }) });
	if (url.pathname !== '/api/log') return fail(404, 'no such route');
	const scope = url.searchParams.get('scope') || 'ot';
	const person = url.searchParams.get('person') || null;
	if (!fixture.scopes.includes(scope)) return fail(404, `no public log for '${scope}'`);
	if (person && !fixture.served.includes(person)) return fail(404, `no public stream for '${person}'`);
	const since = url.searchParams.has('since') ? Number(url.searchParams.get('since')) : null;
	const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 50)));
	let entries = fixture.entries
		.filter((e) => e.scope === scope || e.scope.startsWith(`${scope}.`))
		.filter((e) => !person || e.people.includes(person))
		.filter((e) => since === null || e.seq > since)
		.sort((a, b) => b.seq - a.seq);
	entries = since === null ? entries.slice(0, limit) : entries.slice(-limit);
	const live = ['1', 'true'].includes(url.searchParams.get('live') ?? '');
	return {
		status: 200,
		headers,
		body: JSON.stringify({
			scope,
			person,
			entries,
			next_since: entries.reduce((m, e) => Math.max(m, e.seq), since ?? 0),
			...(live ? { live: fixture.live } : {}),
		}),
	};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	createServer((req, res) => {
		const { status, headers, body } = answer(req.url);
		res.writeHead(status, headers);
		res.end(body);
	}).listen(port, () => console.log(`log fixture feed on :${port}`));
}
