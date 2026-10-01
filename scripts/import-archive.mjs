#!/usr/bin/env node
// Imports the recovered archive (todds-vault derived/blog-archive/) into src/content/blog/.
//
//   node scripts/import-archive.mjs [path/to/todds-vault]     (default: ../todds-vault)
//
// Idempotent: each file is written only when its output differs, so a re-run changes nothing.
// Bodies go in as written. The only frontmatter it changes is a messy Tumblr title; it adds
// `archive: true`, and `kind: note` for the posts the review marks SHORT. No `canonical` is
// written: an archive post is canonical here.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const vault = resolve(root, process.argv[2] ?? '../todds-vault');
const sourceDir = join(vault, 'derived/blog-archive');
const reviewFile = join(vault, 'derived/blog-archive-review.md');
const targetDir = join(root, 'src/content/blog');

// The frontmatter keys the export writes, in the order it writes them.
const KNOWN = [
	'title',
	'description',
	'pubDate',
	'source',
	'dateIsCeiling',
	'dateSource',
	'originalKey',
	'wordCount',
	'reblogOf',
	'tumblrTags',
];

/** The export's frontmatter is one `key: <JSON scalar>` per line. */
function parse(file, text) {
	const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) throw new Error(`${file}: no frontmatter`);
	const data = {};
	for (const line of match[1].split('\n')) {
		const kv = line.match(/^(\w+): (.*)$/);
		if (!kv) throw new Error(`${file}: unreadable frontmatter line ${JSON.stringify(line)}`);
		if (!KNOWN.includes(kv[1])) throw new Error(`${file}: unknown frontmatter key ${kv[1]}`);
		data[kv[1]] = JSON.parse(kv[2]);
	}
	return { data, body: match[2] };
}

// --- Titles (Tumblr only) ---

const NAME_PREFIX = /^Todd Sampson\s*[—–-]\s*/;
// A line that is only a reblog source: "austinkleon :", "OneTrueFan:", "(Source: youtube.com )".
const SOURCE_ONLY = /^(?:@?[\w.-]+\s*:|\(Source:[^)]*\))$/i;
// Tumblr's stand-in for an audio player that did not survive: not a title.
const PLAYER_ONLY = /^\[\s*Flash \d+ is required to listen to audio\.?\s*\]$/i;

/** The body's first sentence, ≤80 characters, no trailing colon; null when the body has none. */
function firstSentence(body) {
	const line = body
		.split('\n')
		.map((l) => l.trim())
		.find((l) => l && !SOURCE_ONLY.test(l) && !PLAYER_ONLY.test(l));
	if (!line) return null;
	let sentence = line.replace(/\s+/g, ' ').match(/^.+?[.!?…](?=\s|$)|^.+$/)[0];
	if (sentence.length > 80) {
		const cut = sentence.slice(0, 79);
		sentence = `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : 79)}…`;
	}
	return sentence.replace(/\s*:+$/, '');
}

function cleanTitle(title, body) {
	let out = title.replace(NAME_PREFIX, '').trim();
	if (!out || SOURCE_ONLY.test(out) || PLAYER_ONLY.test(out)) out = firstSentence(body) ?? out;
	return out;
}

// --- SHORT marks, from the review ---

function shortMarks() {
	const marks = new Set();
	for (const line of readFileSync(reviewFile, 'utf8').split('\n')) {
		const m = line.match(/^- .*· short(?: ·.*)? → `([^`]+)`$/);
		if (m) marks.add(m[1]);
	}
	return marks;
}

// --- Output ---

const yaml = (value) => (typeof value === 'string' ? JSON.stringify(value) : String(value));

function render(data, body) {
	const lines = Object.entries(data).map(([key, value]) => `${key}: ${yaml(value)}`);
	return `---\n${lines.join('\n')}\n---\n${body}`;
}

// A line opening with `#` is a comment in a pasted config (the ROS/Docker posts), not a heading:
// escape the mark so Markdown shows it as written.
const escapeHeadings = (body) => body.replace(/^(#+)(?=\s)/gm, '\\$1');

if (!existsSync(sourceDir)) {
	console.error(`No archive at ${sourceDir}`);
	process.exit(1);
}

const shorts = shortMarks();
const files = readdirSync(sourceDir)
	.filter((f) => f.endsWith('.md'))
	.sort();
const changedTitles = [];
let written = 0;
let notes = 0;
const mismatches = [];

for (const file of files) {
	if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(file)) throw new Error(`${file}: not <yyyy-mm-dd>-<slug>.md`);
	const { data, body } = parse(file, readFileSync(join(sourceDir, file), 'utf8'));
	if (!file.startsWith(data.pubDate)) throw new Error(`${file}: slug date ≠ pubDate ${data.pubDate}`);

	const out = { ...data };
	if (data.source === 'tumblr') {
		const title = cleanTitle(data.title, body);
		if (title !== data.title) {
			changedTitles.push({ file, before: data.title, after: title });
			out.title = title;
		}
	}
	const isNote = shorts.has(file);
	const under200 = body.trim().length < 200;
	if (isNote !== under200) mismatches.push(`${file} (review ${isNote ? 'SHORT' : 'not short'}, ${body.trim().length} chars)`);
	if (isNote) {
		out.kind = 'note';
		notes++;
	}
	out.archive = true;

	const text = render(out, escapeHeadings(body));
	const target = join(targetDir, file);
	if (existsSync(target) && readFileSync(target, 'utf8') === text) continue;
	writeFileSync(target, text);
	written++;
}

console.log(`${files.length} archive files · ${notes} notes · ${written} written · ${files.length - written} unchanged`);
if (mismatches.length) {
	console.log(`\nSHORT mark vs. <200 characters disagree on ${mismatches.length} (the review's mark wins):`);
	for (const m of mismatches) console.log(`  ${m}`);
}
console.log(`\n${changedTitles.length} Tumblr title(s) changed:`);
for (const { file, before, after } of changedTitles) console.log(`  ${file}\n    ${before}\n  → ${after}`);
