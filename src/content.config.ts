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
			// Recovered from the old blog or Tumblr (scripts/import-archive.mjs); canonical here.
			archive: z.boolean().default(false),
			// Another site's URL when the piece's canonical home is not here.
			canonical: z.string().url().optional(),
			// The export's provenance, kept as it wrote it.
			dateSource: z.enum(['permalink', 'page', 'capture-ceiling', 'posted']).optional(),
			originalKey: z.string().optional(),
			wordCount: z.number().int().nonnegative().optional(),
			reblogOf: z.string().optional(),
			tumblrTags: z.string().optional(),
			// The documents a post stands on; the Evidence box renders only when present.
			evidence: z
				.array(z.union([z.string(), z.object({ label: z.string(), href: z.string().optional() })]))
				.optional(),
		})
			// A frontmatter field the schema does not name fails the build instead of vanishing.
			.strict(),
});

export const collections = { blog };
