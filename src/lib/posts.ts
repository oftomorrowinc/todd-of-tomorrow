import { type CollectionEntry, getCollection } from 'astro:content';
import { LAUNCH_POST_ID } from '../consts';

export type Post = CollectionEntry<'blog'>;

/** Every entry, newest first; a shared date (the archive has many) falls back to the id, so prev/next is stable. */
export async function getPosts(): Promise<Post[]> {
	return (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
	);
}

export interface Badge {
	text: string;
	tone: 'grey' | 'indigo';
}

/** One badge per post, or none. */
export function badgeFor(post: Post): Badge | null {
	if (post.data.vault) return { text: 'From the vault', tone: 'indigo' };
	switch (post.data.source) {
		case 'tumblr':
			return { text: 'Tumblr · archive', tone: 'grey' };
		case 'wordpress':
			return { text: 'WordPress · archive', tone: 'grey' };
		case 'linkedin':
			return { text: 'first on LinkedIn', tone: 'grey' };
	}
	if (post.id === LAUNCH_POST_ID) return { text: 'Launch', tone: 'grey' };
	return null;
}

/** "N min read" at 230 words a minute. */
export function readTime(post: Post): string {
	const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
	return `${Math.max(1, Math.ceil(words / 230))} min read`;
}
