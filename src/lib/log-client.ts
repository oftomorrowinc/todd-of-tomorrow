// The build log in the browser: the live line, and whatever is newer than the
// build. A static page that only showed what it was built with would be hours
// stale and still look live; this asks the feed on load and every minute.

import { entryHtml, liveHtml, queryUrl, type LogPage } from './log';

const POLL_MS = 60_000;

async function read(el: HTMLElement, count: number): Promise<LogPage | null> {
	try {
		const url = queryUrl(el.dataset.feed!, { person: el.dataset.person, limit: count, live: true });
		const res = await fetch(url);
		return res.ok ? ((await res.json()) as LogPage) : null;
	} catch {
		return null;
	}
}

/** The sidebar: the live line, absent (not "idle") when nothing is claimed,
 *  and the newest ten, redrawn when the feed has newer. */
export function startSidebar(el: HTMLElement) {
	const count = Number(el.dataset.count ?? 10);
	let newest = Number(el.dataset.since ?? 0);
	const live = el.querySelector<HTMLElement>('[data-live]')!;
	const list = el.querySelector<HTMLElement>('[data-entries]')!;
	const tick = async () => {
		const page = await read(el, count);
		if (!page) return;
		const lines = page.live ?? [];
		live.innerHTML = liveHtml(lines);
		live.hidden = lines.length === 0;
		const top = page.entries[0]?.seq ?? 0;
		if (top <= newest) return;
		newest = top;
		el.querySelector('[data-empty]')?.remove();
		list.innerHTML = page.entries
			.slice(0, count)
			.map((e) => `<li class="log-entry" data-testid="log-entry" data-seq="${e.seq}">${entryHtml(e)}</li>`)
			.join('');
	};
	void tick();
	setInterval(() => {
		if (document.visibilityState === 'visible') void tick();
	}, POLL_MS);
}
