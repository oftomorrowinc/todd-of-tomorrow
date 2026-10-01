// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Todd Of Tomorrow';
// Todd's LinkedIn headline of record (todds-vault derived/posts-2026-09-launch.md §E, 09-25).
export const SITE_DESCRIPTION =
	"Still an optimist. A great big beautiful tomorrow doesn't arrive in your feed. We have to build it. So let's get to work.";

// Posts whose canonical home is another site, by post id. Everything else is canonical here.
// The launch post was announced on oftomorrow.net and stays canonical there.
export const CANONICAL_URLS: Record<string, string> = {
	'byollm-is-open-source': 'https://oftomorrow.net/blog/byollm-is-open-source/',
};

// The launch post, which carries the "Launch" badge.
export const LAUNCH_POST_ID = 'byollm-is-open-source';
