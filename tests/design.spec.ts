import { test, expect, type Page } from '@playwright/test';
import { emptyRuns, gapSentence, yearCounts } from '../src/lib/years';
import { posts } from './collection';

const CURRENT_YEAR = new Date().getFullYear();
const counts = yearCounts(posts.map((p) => p.date), CURRENT_YEAR);

// The record as it will be after the archive import: 2008–2017, nine quiet years, then now.
const fixture = [
  ...Array.from({ length: 65 }, () => new Date(2008, 5, 1)),
  ...Array.from({ length: 145 }, (_, i) => new Date(2009 + (i % 9), 2, 1)),
  new Date(2026, 8, 25),
  new Date(2026, 8, 30),
];

test.describe('year arithmetic', () => {
  test('one entry per year from the first post to the current year, empty years kept', () => {
    const c = yearCounts(fixture, 2026);
    expect(c.map((y) => y.year)).toEqual(Array.from({ length: 19 }, (_, i) => 2008 + i));
    expect(c.filter((y) => y.count === 0).map((y) => y.year)).toEqual([
      2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
    ]);
    expect(emptyRuns(c)).toEqual([{ from: 2018, to: 2025 }]);
  });

  test('the gap sentence is computed', () => {
    expect(gapSentence(yearCounts(fixture, 2026))).toBe(
      '210 posts between 2008 and 2017, then 8 years with nothing published.',
    );
  });

  test('a backfilled post shrinks the empty block', () => {
    const c = yearCounts([...fixture, new Date(2021, 0, 1)], 2026);
    expect(emptyRuns(c)).toEqual([
      { from: 2018, to: 2020 },
      { from: 2022, to: 2025 },
    ]);
    expect(gapSentence(c)).toBe('211 posts between 2008 and 2021, then 4 years with nothing published.');
  });

  test('no gap, no sentence', () => {
    expect(gapSentence(yearCounts([new Date(2026, 0, 1)], 2026))).toBeNull();
  });
});

const PAGES = ['/', '/archive', '/about', ...posts.map((p) => `/blog/${p.id}/`)];
// The two posts written here and one of each kind the archive brings: they share one layout.
const SAMPLE = [
  '/',
  '/archive',
  '/about',
  ...posts
    .filter((p, i, all) => !p.archive || all.findIndex((q) => q.source === p.source && q.note === p.note) === i)
    .map((p) => `/blog/${p.id}/`),
];

test('every page renders and every internal chrome link resolves', async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const path of PAGES) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('header .wordmark')).toBeVisible();
    for (const href of await page.locator('header a, footer a, main a').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href')!),
    )) {
      if (href.startsWith('/')) hrefs.add(href.split('#')[0]);
    }
  }
  expect([...hrefs]).toEqual(expect.arrayContaining(['/', '/archive', '/about', '/rss.xml']));
  for (const href of hrefs) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('the home strip draws one bar per year, empty years dashed, now in ember', async ({ page }) => {
  await page.goto('/');
  const bars = page.locator('.strip li');
  await expect(bars).toHaveCount(counts.length);
  for (const [i, { year, count }] of counts.entries()) {
    const li = bars.nth(i);
    await expect(li).toHaveAttribute('data-year', String(year));
    await expect(li).toHaveAttribute('data-count', String(count));
    await expect(li.locator('.year')).toHaveText(String(year).slice(-2));
    const bar = await li.locator('.bar').evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderTopStyle, width: s.borderTopWidth, height: s.height, bg: s.backgroundColor };
    });
    if (count === 0) {
      expect(bar.border, `${year}`).toBe('dashed');
      expect(bar.height).toBe('4px');
    } else {
      expect(bar.width, `${year}`).toBe('0px');
      expect(bar.bg).toBe(year === CURRENT_YEAR ? 'rgb(232, 89, 12)' : 'rgb(67, 56, 202)');
    }
  }
  const sentence = gapSentence(counts);
  if (sentence) await expect(page.locator('.sentence')).toHaveText(sentence);
  else await expect(page.locator('.sentence')).toHaveCount(0);
});

test('the archive draws each run of empty years from the data', async ({ page }) => {
  await page.goto('/archive');
  const runs = emptyRuns(counts);
  const blocks = page.locator('.block.empty');
  await expect(blocks).toHaveCount(runs.length);
  for (const [i, run] of [...runs].reverse().entries()) {
    const label = run.from === run.to ? `${run.from}` : `${run.from}–${run.to}`;
    await expect(blocks.nth(i).locator('.gap')).toHaveText(`${label} · nothing published`);
    const later = posts.filter((p) => p.date.getUTCFullYear() > run.to).reverse();
    const after = later.find((p) => p.vault) ?? later[0];
    await expect(blocks.nth(i).locator('a')).toHaveAttribute('href', `/blog/${after.id}/`);
    await expect(blocks.nth(i).locator('a')).toHaveText(`${after.title} →`);
    // The quiet the vault breaks carries the copy; its opening word counts the run.
    const n = run.to - run.from + 1;
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    if (after.vault) {
      await expect(blocks.nth(i).locator('.quiet')).toHaveText(
        `${words[n] ?? n} ${n === 1 ? 'year' : 'years'} with nothing published here. Not nothing built - a 3D-printer company, a decade of robotics, a game studio, a writing system, and a protocol. Just nothing said.`,
      );
    } else await expect(blocks.nth(i).locator('.quiet')).toHaveCount(0);
  }
  // One block per year with posts, newest first; the current year's pill is filled ink.
  const years = counts.filter((c) => c.count > 0).map((c) => c.year).reverse();
  await expect(page.locator('.block:not(.empty) h2')).toHaveText(years.map(String));
  await expect(page.locator('.pills a.current')).toHaveText(String(CURRENT_YEAR));
  expect(
    await page.locator('.pills a.current').evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe('rgb(21, 19, 31)');
  for (const post of posts) {
    await expect(page.locator(`.row a[href="/blog/${post.id}/"]`)).toHaveText(post.title);
  }
});

test('posts: meta line, one badge, standfirst, indigo quote rule, prev/next', async ({ page }) => {
  await page.goto('/blog/the-rule-i-wrote-and-then-broke/');
  await expect(page.locator('.post > .meta')).toHaveText(/^\s*Sep 30, 2026\s+·\s+From the vault\s+·\s+\d+ min read\s*$/);
  await expect(page.locator('.post .badge')).toHaveCount(1);
  const standfirst = page.locator('.prose > p').first();
  await expect(standfirst).toHaveText('From the vault. Written now, about 2023.');
  expect(await standfirst.evaluate((el) => getComputedStyle(el).fontSize)).toBe('23px');
  const quote = await page
    .locator('.prose blockquote')
    .first()
    .evaluate((el) => getComputedStyle(el));
  expect([quote.borderLeftWidth, quote.borderLeftStyle, quote.borderLeftColor]).toEqual([
    '3px',
    'solid',
    'rgb(67, 56, 202)',
  ]);
  await expect(page.locator('.evidence')).toHaveCount(0);
  const at = (id: string) => posts.findIndex((p) => p.id === id);
  await expect(page.locator('a[rel="prev"]')).toHaveAttribute(
    'href',
    `/blog/${posts[at('the-rule-i-wrote-and-then-broke') + 1].id}/`,
  );

  await page.goto('/blog/byollm-is-open-source/');
  await expect(page.locator('.post .badge')).toHaveText('Launch');
  await expect(page.locator('a[rel="next"]')).toHaveAttribute(
    'href',
    `/blog/${posts[at('byollm-is-open-source') - 1].id}/`,
  );
});

test('home: the two newest posts as cards, under the headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.eyebrow')).toHaveText('Founder, Of Tomorrow · building in public');
  await expect(page.locator('.hero .lede')).toHaveText(
    "Real dates, real work, including the parts that didn't work. Posts out of the vault, and what's being built now.",
  );
  const newest = posts.filter((p) => !p.note).slice(0, 2);
  await expect(page.locator('.card h3')).toHaveText(newest.map((p) => p.title));
  await expect(page.locator('.card .read').first()).toHaveText('Read it →');
});

test('the label face is Big Shoulders Display, shared with oftomorrow.net; reading stays Source Serif', async ({
  page,
}) => {
  await page.goto('/');
  const fonts = await page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]').getAttribute('href');
  expect(fonts).toContain('family=Big+Shoulders+Display:wght@700;900');
  expect(fonts).toContain('display=swap');
  expect(fonts).not.toContain('Space+Grotesk');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('900 40px "Big Shoulders Display"'))).toBe(true);
  const style = (sel: string) =>
    page.locator(sel).first().evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        family: s.fontFamily,
        weight: s.fontWeight,
        size: s.fontSize,
        lineHeight: s.lineHeight,
        transform: s.textTransform,
        tracking: parseFloat(s.letterSpacing) / parseFloat(s.fontSize),
      };
    });
  const mark = await style('.wordmark');
  expect(mark).toMatchObject({ weight: '900', size: '40px', lineHeight: '36px', transform: 'uppercase' });
  expect(mark.family).toMatch(/^"?Big Shoulders Display/);
  for (const sel of ['header nav a', '.eyebrow', '.label', '.card .meta', '.badge', '.card .read', '.site-footer']) {
    const s = await style(sel);
    expect(s.family, sel).toMatch(/^"?Big Shoulders Display/);
    expect([s.weight, s.transform], sel).toEqual(['700', 'uppercase']);
    expect(s.tracking, sel).toBeGreaterThanOrEqual(0.08 - 1e-3);
    expect(s.tracking, sel).toBeLessThanOrEqual(0.14 + 1e-3);
  }
  for (const sel of ['main h1', '.card h3', '.hero .lede']) {
    expect(await style(sel).then((s) => s.family), sel).toMatch(/^"?Source Serif 4/);
  }
});

// WCAG relative luminance contrast between two rgb() strings.
function contrast(fg: string, bg: string) {
  const lum = (c: string) => {
    const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

async function textColors(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      let bg = 'rgba(0, 0, 0, 0)';
      for (let n: Element | null = el; n && /rgba\(.*, 0\)/.test(bg); n = n.parentElement) {
        bg = getComputedStyle(n).backgroundColor;
      }
      if (/rgba\(.*, 0\)/.test(bg)) bg = 'rgb(255, 255, 255)';
      return { text: el.textContent!.trim().slice(0, 30), fg: getComputedStyle(el).color, bg };
    }),
  );
}

test('meta grey and labels hold 4.5:1 on every ground', async ({ page }) => {
  for (const path of SAMPLE) {
    await page.goto(path);
    // Every label-face element (the condensed face makes thin strokes; the colors must carry it). The
    // ember "now" year label is the brief's one exception and is reported, not asserted.
    for (const c of await textColors(
      page,
      '.meta, .label, .eyebrow, .badge, .site-footer p, .site-footer a, header nav a, .read, .pills a, .gap, .after, .strip li:not(.now) .year',
    )) {
      expect(contrast(c.fg, c.bg), `${path} "${c.text}" ${c.fg} on ${c.bg}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('phone: header stacks, cards go full width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mark = (await page.locator('.wordmark').boundingBox())!;
  const nav = (await page.locator('header nav').boundingBox())!;
  expect(nav.y).toBeGreaterThanOrEqual(mark.y + mark.height);
  expect(await page.locator('main h1').evaluate((el) => getComputedStyle(el).fontSize)).toBe('30px');
  const [a, b] = await page.locator('.card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().x));
  expect(a).toBe(b);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
