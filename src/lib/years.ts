// Build-time arithmetic for the year strip and the archive. Pure, so the tests can run it on a
// fixture as well as on the collection.

export interface YearCount {
	year: number;
	count: number;
}

export interface EmptyRun {
	from: number;
	to: number;
}

/** One entry per year from the first post's year through `currentYear`, zero-count years included. */
export function yearCounts(dates: Date[], currentYear: number): YearCount[] {
	const counts = new Map<number, number>();
	for (const date of dates) counts.set(date.getFullYear(), (counts.get(date.getFullYear()) ?? 0) + 1);
	const years = [...counts.keys()];
	const first = Math.min(currentYear, ...years);
	const last = Math.max(currentYear, ...years);
	const out: YearCount[] = [];
	for (let year = first; year <= last; year++) out.push({ year, count: counts.get(year) ?? 0 });
	return out;
}

/** Each run of consecutive zero-count years, oldest first. */
export function emptyRuns(counts: YearCount[]): EmptyRun[] {
	const runs: EmptyRun[] = [];
	for (const { year, count } of counts) {
		if (count > 0) continue;
		const last = runs.at(-1);
		if (last && last.to === year - 1) last.to = year;
		else runs.push({ from: year, to: year });
	}
	return runs;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * "<N> posts between <first> and <last-before-gap>, then <gap> years with nothing published."
 * The gap is the longest empty run (the most recent, on a tie); null when there is none.
 */
export function gapSentence(counts: YearCount[]): string | null {
	const gap = emptyRuns(counts).reduce<EmptyRun | null>(
		(best, run) => (!best || run.to - run.from >= best.to - best.from ? run : best),
		null,
	);
	if (!gap || gap.from === counts[0].year) return null;
	const before = counts.filter((c) => c.year < gap.from);
	const n = before.reduce((sum, c) => sum + c.count, 0);
	const first = before[0].year;
	const lastBefore = gap.from - 1;
	const span = first === lastBefore ? `in ${first}` : `between ${first} and ${lastBefore}`;
	return `${plural(n, 'post')} ${span}, then ${plural(gap.to - gap.from + 1, 'year')} with nothing published.`;
}
