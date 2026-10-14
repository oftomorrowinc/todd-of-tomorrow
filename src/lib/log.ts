// THE BUILD LOG: Todd's stream from signals.oftomorrow.net's public feed
// (`GET /api/log?person=todd`, job #944), the way oftomorrow.net reads it
// (of-tomorrow-website's src/lib/log.ts, job #946): read at BUILD time, and
// read again in the browser on load (log-client.ts) for the live line and
// anything newer than the build. What may be shown is decided by the feed —
// its fences are in its query — so nothing here filters, it only renders.
//
// The renderers are plain functions returning HTML so the page and the
// browser write an entry the same way. Every string from the feed goes
// through esc(): the feed's markup stays text.

export const LOG_FEED_URL = 'https://signals.oftomorrow.net/api/log';

/** The whole log, on oftomorrow.net. */
export const LOG_PAGE = 'https://oftomorrow.net/log/todd';

export const LOG_PERSON = 'todd';

/** How many entries the sidebar shows. */
export const LOG_COUNT = 10;

/** The day an entry belongs to is the day where the work is done. */
export const LOG_TIME_ZONE = 'America/New_York';

/** The feed the build reads. Tests point it at a fixture server. */
export function feedUrl(): string {
	return (typeof process !== 'undefined' && process.env.LOG_FEED_URL) || LOG_FEED_URL;
}

export interface LogEntry {
	seq: number;
	at: string;
	kind: 'job.done' | 'job.landed' | 'decision.logged' | 'decision.ruled' | 'message';
	scope: string;
	project: string;
	people: string[];
	/** "ccs, for todd" */
	by: string;
	title: string | null;
	body: string | null;
	link: string | null;
	id: string | null;
	commit?: string | null;
	repo?: string | null;
	worked?: string | null;
}

export interface LiveLine {
	by: string;
	id: string;
	title: string;
	scope: string;
	/** "ccs is on #915 for 37m" */
	line: string;
}

export interface LogPage {
	entries: LogEntry[];
	live?: LiveLine[];
	next_since?: number;
}

export function queryUrl(base: string, q: { person?: string; limit?: number; live?: boolean }): string {
	const params = new URLSearchParams();
	if (q.person) params.set('person', q.person);
	if (q.limit !== undefined) params.set('limit', String(q.limit));
	if (q.live) params.set('live', '1');
	const s = params.toString();
	return s ? `${base}?${s}` : base;
}

// ---------------------------------------------------------------- the build

/** Todd's newest entries. Unreachable (or anything but a page) is an empty
 *  list and a warning: the browser fills it. */
export async function readLog(): Promise<LogEntry[]> {
	const url = queryUrl(feedUrl(), { person: LOG_PERSON, limit: LOG_COUNT });
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const page = (await res.json()) as LogPage;
		console.log(`[log] ${url}: ${page.entries.length} entries`);
		return page.entries.slice(0, LOG_COUNT);
	} catch (err) {
		console.warn(`[log] ${url} unreachable (${(err as Error).message}); built empty`);
		return [];
	}
}

// ---------------------------------------------------------- the rendering

export function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Escaped prose, with `backticks` as code. */
function prose(s: string): string {
	return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** byollm from ot.byollm. */
export function projectSlug(scope: string): string {
	return scope.split('.')[1] ?? scope;
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: LOG_TIME_ZONE,
	month: 'short',
	day: 'numeric',
});

const VERB: Record<LogEntry['kind'], string> = {
	'job.done': 'Built',
	'job.landed': 'Landed',
	'decision.logged': 'Decided',
	'decision.ruled': 'Ruled',
	message: 'Said',
};

/** "Landed #944 as 358ac1c in signals" — the card number links to the card. */
function headHtml(e: LogEntry): string {
	const card = e.id
		? e.link
			? ` <a href="${esc(e.link)}" class="log-card">#${esc(e.id)}</a>`
			: ` #${esc(e.id)}`
		: '';
	let head = `${VERB[e.kind] ?? 'Logged'}${e.kind === 'decision.logged' || e.kind === 'decision.ruled' ? ' on' : ''}${card}`;
	if (e.kind === 'job.landed') {
		if (e.commit) head += ` as <code>${esc(e.commit)}</code>`;
		if (e.repo) head += ` in ${esc(e.repo)}`;
	}
	return head;
}

/** One line, the way oftomorrow.net's strip writes it: `[by · project]`, what
 *  happened, the card number, the title — the title linking to the entry on
 *  oftomorrow.net/log/todd. A message has no title; its body is the line. */
export function entryHtml(e: LogEntry): string {
	const bracket = `<span class="log-bracket">[${esc(e.by)} · ${esc(projectSlug(e.scope))}]</span>`;
	const text = e.title ?? e.body?.trim() ?? '';
	const line = text ? `: <a href="${LOG_PAGE}#e${e.seq}" class="log-title">${prose(text)}</a>` : '';
	const time = `<time datetime="${esc(e.at)}" class="log-time">${esc(timeFormat.format(new Date(e.at)))}</time>`;
	return `<p class="log-line">${bracket} ${headHtml(e)}${line} ${time}</p>`;
}

/** "ccs is on #915 for 37m" — the card number links to the card. */
export function liveHtml(lines: LiveLine[]): string {
	return lines
		.map((l) => {
			const text = esc(l.line).replace(`#${esc(l.id)}`, `<a href="${esc(cardLink(l.scope, l.id))}" class="log-card">#${esc(l.id)}</a>`);
			return `<p class="log-live" data-testid="log-live" title="${esc(l.title)}"><span class="log-live-dot" aria-hidden="true"></span>${text}</p>`;
		})
		.join('');
}

/** The card, the way the feed links one (#944's cardLink). */
export function cardLink(scope: string, id: string): string {
	return `https://signals.oftomorrow.net/board?scope=${encodeURIComponent(scope)}&card=${encodeURIComponent(id)}`;
}
