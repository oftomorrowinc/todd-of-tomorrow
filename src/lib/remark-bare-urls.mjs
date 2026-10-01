// Bare URLs in the archive bodies, linked at render time so the files stay as written.
//
// GFM already links `http(s)://…` and `www.…`. This adds the two things it misses:
// - a scheme-less URL with a path (`github.com/oftomorrowinc/byollm`) becomes a link; a domain
//   on its own (`Wired.com`, `(Source: youtube.com )`) is a name in a sentence and stays text;
// - a closing curly quote GFM swept into a link (`“…=http://rosmaster:11311”`) goes back outside it.

const SCHEMELESS = /(?<![\w@/.:-])((?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s<>“”‘’"]*[^\s<>“”‘’".,;:!?)])/gi;
const TRAILING_QUOTES = /[“”‘’"]+$/;

const text = (value) => ({ type: 'text', value });

function linkify(node) {
	const out = [];
	let last = 0;
	for (const match of node.value.matchAll(SCHEMELESS)) {
		if (match.index > last) out.push(text(node.value.slice(last, match.index)));
		out.push({ type: 'link', url: `https://${match[1]}`, children: [text(match[1])] });
		last = match.index + match[1].length;
	}
	if (!out.length) return [node];
	if (last < node.value.length) out.push(text(node.value.slice(last)));
	return out;
}

/** A link whose last text child ends in curly quotes: the quotes leave the link. */
function unquote(link) {
	const tail = link.children.at(-1);
	const quotes = tail?.type === 'text' ? tail.value.match(TRAILING_QUOTES)?.[0] : undefined;
	if (!quotes || !decodeURI(link.url).endsWith(quotes)) return [link];
	tail.value = tail.value.slice(0, -quotes.length);
	link.url = encodeURI(decodeURI(link.url).slice(0, -quotes.length));
	return [link, text(quotes)];
}

function walk(parent) {
	if (!parent.children) return;
	parent.children = parent.children.flatMap((child) => {
		if (child.type === 'link') return unquote(child);
		if (child.type === 'text') return linkify(child);
		if (child.type === 'code' || child.type === 'inlineCode' || child.type === 'html') return [child];
		walk(child);
		return [child];
	});
}

// Archive posts only (`archive: true`): the posts written here link what they mean to.
export default function remarkBareUrls() {
	return (tree, file) => {
		if (file.data.astro?.frontmatter?.archive) walk(tree);
	};
}
