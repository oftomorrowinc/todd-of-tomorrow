import { readdirSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const SITE = 'https://todd.oftomorrow.net';
const BLOG_DIR = new URL('../src/content/blog/', import.meta.url);

// Every file in the content collection, with the title from its frontmatter.
const posts = readdirSync(BLOG_DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((file) => {
    const source = readFileSync(new URL(file, BLOG_DIR), 'utf8');
    const title = source.match(/^title: '(.*)'$/m)?.[1].replace(/''/g, "'");
    return { id: file.replace(/\.mdx?$/, ''), title };
  });

test('the content collection has both posts', () => {
  expect(posts.map((p) => p.id).sort()).toEqual([
    'byollm-is-open-source',
    'the-rule-i-wrote-and-then-broke',
  ]);
});

test('home is the blog index with the masthead and every post', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Todd Of Tomorrow');
  await expect(page.locator('header h2')).toHaveText('Todd Of Tomorrow');
  for (const post of posts) {
    await expect(page.locator(`a[href="/blog/${post.id}/"]`)).toContainText(post.title!);
  }
});

for (const post of posts) {
  test(`post ${post.id} has a page`, async ({ page }) => {
    const response = await page.goto(`/blog/${post.id}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(post.title!);
  });
}

test('canonicals: the launch post stays on oftomorrow.net, Post 1 is here', async ({ page }) => {
  await page.goto('/blog/byollm-is-open-source/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://oftomorrow.net/blog/byollm-is-open-source/',
  );
  await page.goto('/blog/the-rule-i-wrote-and-then-broke/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE}/blog/the-rule-i-wrote-and-then-broke/`,
  );
});

test('about page renders', async ({ page }) => {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('About');
});

test('footer links to oftomorrow.net and byo-llm.com', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer a[href="https://oftomorrow.net"]')).toBeVisible();
  await expect(page.locator('footer a[href="https://byo-llm.com"]')).toBeVisible();
});

test('no third-party scripts', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (req.resourceType() === 'script' && url.hostname !== 'localhost') thirdParty.push(req.url());
  });
  for (const path of ['/', '/about', ...posts.map((p) => `/blog/${p.id}/`)]) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  expect(thirdParty).toEqual([]);
});

test('RSS is well-formed RSS 2.0 with one item per post', async ({ page, request }) => {
  const response = await request.get('/rss.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();

  await page.goto('/');
  const feed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const channel = doc.querySelector('rss > channel');
    return {
      parseError: doc.querySelector('parsererror')?.textContent ?? null,
      version: doc.documentElement.getAttribute('version'),
      title: channel?.querySelector(':scope > title')?.textContent,
      link: channel?.querySelector(':scope > link')?.textContent,
      description: channel?.querySelector(':scope > description')?.textContent,
      items: [...doc.querySelectorAll('rss > channel > item')].map((item) => ({
        title: item.querySelector('title')?.textContent,
        link: item.querySelector('link')?.textContent,
        guid: item.querySelector('guid')?.textContent,
        pubDate: item.querySelector('pubDate')?.textContent,
      })),
    };
  }, xml);

  expect(feed.parseError).toBeNull();
  expect(feed.version).toBe('2.0');
  expect(feed.title).toBe('Todd Of Tomorrow');
  expect(feed.link).toBe(`${SITE}/`);
  expect(feed.description).toBeTruthy();
  expect(feed.items).toHaveLength(posts.length);
  for (const post of posts) {
    const item = feed.items.find((i) => i.link === `${SITE}/blog/${post.id}/`);
    expect(item, post.id).toBeDefined();
    expect(item!.title).toBe(post.title);
    expect(item!.guid).toBe(item!.link);
    expect(Number.isNaN(Date.parse(item!.pubDate!))).toBe(false);
  }
});
