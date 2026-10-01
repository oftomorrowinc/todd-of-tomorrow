import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { posts } from './collection';

const archive = posts.filter((p) => p.archive);

test('the archive is 71 WordPress, 138 Tumblr and 2 LinkedIn; 88 notes; 117 ceilings', () => {
  const by = (source: string) => archive.filter((p) => p.source === source).length;
  expect([by('wordpress'), by('tumblr'), by('linkedin')]).toEqual([71, 138, 2]);
  expect(archive.filter((p) => p.note)).toHaveLength(88);
  expect(archive.filter((p) => p.ceiling)).toHaveLength(117);
});

test('the import is idempotent: a re-run writes nothing', () => {
  const vault = new URL('../../todds-vault/derived/blog-archive/', import.meta.url);
  test.skip(!existsSync(vault), 'no todds-vault checkout beside this one');
  const out = execFileSync('node', ['scripts/import-archive.mjs'], { encoding: 'utf8' });
  expect(out).toMatch(/^211 archive files · 88 notes · 0 written · 211 unchanged$/m);
});

// One of each: the meta line reads date · badge · read time; a ceiling reads "by".
const SPECIMENS = [
  { id: '2008-01-15-is-adobe-the-new-microsoft', date: 'Jan 15, 2008', badge: 'WordPress · archive', note: false },
  { id: '2016-03-19-ros-visualization-packages-in-docker-amp', date: 'by Mar 19, 2016', badge: 'Tumblr · archive', note: false },
  { id: '2008-01-13-blogging-again', date: 'Jan 13, 2008', badge: 'WordPress · archive', note: true },
  { id: '2014-08-22-source-youtube-com', date: 'by Aug 22, 2014', badge: 'Tumblr · archive', note: true },
  { id: '2026-09-28-byollm-is-open-source-linkedin', date: 'Sep 28, 2026', badge: 'first on LinkedIn', note: false },
];

const squash = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();

for (const { id, date, badge, note } of SPECIMENS) {
  test(`${id}: badge and date on the post and its archive row`, async ({ page }) => {
    await page.goto(`/blog/${id}/`);
    expect(squash(await page.locator('.post > .meta').textContent())).toMatch(
      new RegExp(`^${date} · ${badge} · \\d+ min read$`),
    );
    await expect(page.locator('.post .badge')).toHaveText(badge);

    await page.goto('/archive');
    const row = page.locator('.row').filter({ has: page.locator(`a[href="/blog/${id}/"]`) });
    expect(squash(await row.locator('.date').textContent())).toBe(date);
    await expect(row.locator('.badge')).toHaveText(note ? 'note' : badge);
    expect(await row.evaluate((el) => el.classList.contains('note'))).toBe(note);
  });
}

test('LinkedIn: "First posted on LinkedIn, <date>." is the first line; both launch posts stand', async ({ page }) => {
  await page.goto('/blog/2026-09-28-byollm-is-open-source-linkedin/');
  await expect(page.locator('.prose > p').first()).toHaveText('First posted on LinkedIn, September 28, 2026.');
  await page.goto('/blog/2026-09-25-where-ive-been/');
  await expect(page.locator('.prose > p').first()).toHaveText('First posted on LinkedIn, September 25, 2026.');
  await expect(page.locator('.post .badge')).toHaveText('first on LinkedIn');
  // The 09-25 launch post written here is a different text, and keeps its own page and badge.
  await page.goto('/blog/byollm-is-open-source/');
  await expect(page.locator('.post .badge')).toHaveText('Launch');
});

test('archive year counts match the data: 2008 = 64 … 2017 = 1', async ({ page }) => {
  const expected: Record<number, number> = {};
  for (const p of posts) expected[p.date.getUTCFullYear()] = (expected[p.date.getUTCFullYear()] ?? 0) + 1;
  expect(expected).toMatchObject({ 2008: 64, 2009: 7, 2010: 19, 2011: 30, 2012: 21, 2013: 13 });
  expect(expected).toMatchObject({ 2014: 25, 2015: 22, 2016: 7, 2017: 1, 2026: 4 });

  await page.goto('/archive');
  for (const [year, count] of Object.entries(expected)) {
    const block = page.locator(`#y${year}`);
    await expect(block.locator('.side .meta')).toHaveText(`${count} ${count === 1 ? 'post' : 'posts'}`);
    await expect(block.locator('.row')).toHaveCount(count);
  }
  // Every ceiling reads "by", and nothing else does.
  const dates = (await page.locator('.row .date').allTextContents()).map(squash);
  expect(dates.filter((d) => d.startsWith('by '))).toHaveLength(posts.filter((p) => p.ceiling).length);
});

test('a Tumblr audio-player stand-in is not a title; the body gives one', async ({ page }) => {
  await page.goto('/blog/2011-10-19-bijan-mumford-sons-golden-slumbers-carry/');
  await expect(page.locator('h1')).toHaveText('Mumford & Sons - Golden Slumbers/Carry That Weight');
});

test('bodies as written: bare URLs link, a pasted # comment stays text, no <img>', async ({ page }) => {
  await page.goto('/blog/2016-03-19-ros-visualization-packages-in-docker-amp/');
  await expect(page.locator('.prose h1, .prose h2, .prose h3')).toHaveCount(0);
  await expect(page.locator('.prose p', { hasText: /^# image: toddsampson\/ros-indigo-image_pipeline$/ })).toHaveCount(1);
  // The closing quote GFM would sweep into the link stays outside it.
  await expect(page.locator('.prose a[href="http://rosmaster:11311"]')).toHaveText('http://rosmaster:11311');

  await page.goto('/blog/2026-09-28-byollm-is-open-source-linkedin/');
  await expect(page.locator('.prose a[href="https://github.com/oftomorrowinc/byollm"]')).toHaveText(
    'github.com/oftomorrowinc/byollm',
  );
  // A domain named in a sentence is not a link.
  await expect(page.locator('.prose a', { hasText: /^byo-llm\.com$/ })).toHaveCount(0);

  await page.goto('/blog/2010-05-17-liked-seeing-chrismessina-still-has-mybloglog-as/');
  await expect(page.locator('.prose a[href="http://otf.me/Bc"]')).toHaveCount(1);

  for (const id of ['2012-04-15-3d-printed-model-rockets-with-a-bottle-of-scotch', '2016-03-19-ros-usb-sensor-input-in-docker-amp']) {
    await page.goto(`/blog/${id}/`);
    await expect(page.locator('.prose img')).toHaveCount(0);
  }
});
