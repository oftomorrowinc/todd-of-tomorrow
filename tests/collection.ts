import { readdirSync, readFileSync } from 'node:fs';

const BLOG_DIR = new URL('../src/content/blog/', import.meta.url);

// A frontmatter scalar as the posts write it: 'single-quoted YAML', "a JSON string", or bare.
function scalar(raw: string): string {
  if (raw.startsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  if (raw.startsWith('"')) return JSON.parse(raw);
  return raw;
}

export interface Entry {
  id: string;
  title: string;
  date: Date;
  vault: boolean;
  archive: boolean;
  note: boolean;
  ceiling: boolean;
  source?: string;
}

/** The collection as the build sees it, newest first. */
export const posts: Entry[] = readdirSync(BLOG_DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((file) => {
    const front = readFileSync(new URL(file, BLOG_DIR), 'utf8').split(/^---$/m)[1];
    const data: Record<string, string> = {};
    for (const m of front.matchAll(/^(\w+): (.*)$/gm)) data[m[1]] = scalar(m[2]);
    return {
      id: file.replace(/\.mdx?$/, ''),
      title: data.title,
      date: new Date(data.pubDate),
      vault: data.vault === 'true',
      archive: data.archive === 'true',
      note: data.kind === 'note',
      ceiling: data.dateIsCeiling === 'true',
      source: data.source,
    };
  })
  .sort((a, b) => +b.date - +a.date || a.id.localeCompare(b.id));
