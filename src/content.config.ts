import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			// The pubDate is the latest it could be, not the day it went up ("by <date>").
			dateIsCeiling: z.boolean().default(false),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// A note renders as a smaller archive row and is left out of "Latest".
			kind: z.enum(['post', 'note']).default('post'),
			// Where the piece first appeared, when that was not here.
			source: z.enum(['wordpress', 'tumblr', 'linkedin']).optional(),
			// Written now, out of the vault.
			vault: z.boolean().default(false),
			// The documents a post stands on; the Evidence box renders only when present.
			evidence: z
				.array(z.union([z.string(), z.object({ label: z.string(), href: z.string().optional() })]))
				.optional(),
		}),
});

export const collections = { blog };
