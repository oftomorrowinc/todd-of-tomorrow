import { test, expect, type Page } from '@playwright/test';
import { fixture } from './fixtures/log-feed.mjs';

// The sidebar's build log, against the fixture feed the build read (playwright.config.ts).
const FEED = 'http://localhost:4397/api/log';
const todds = fixture.entries.filter((e: { people: string[] }) => e.people.includes('todd')).slice(0, 10);

/** What the build wrote, before the browser touches it. */
async function built(page: Page) {
  await page.route(`${FEED}**`, (route) => route.abort());
  await page.goto('/');
}

test('the build writes todd\'s newest ten, newest first, linking to the whole log', async ({ page }) => {
  await built(page);
  const sidebar = page.getByTestId('log-sidebar');
  await expect(sidebar.locator('h2')).toHaveText('The build log');
  const entries = sidebar.getByTestId('log-entry');
  await expect(entries).toHaveCount(10);
  expect(await entries.evaluateAll((els) => els.map((el) => Number((el as HTMLElement).dataset.seq)))).toEqual(
    todds.map((e: { seq: number }) => e.seq),
  );
  await expect(page.getByTestId('log-all')).toHaveAttribute('href', 'https://oftomorrow.net/log/todd');
  await expect(page.getByTestId('log-all')).toHaveText('The whole log →');
  // `[by · project]`, what happened, the card number (linking to the card), the title.
  await expect(entries.nth(2)).toContainText('[ccs, for todd · signals] Landed #944 as 358ac1c in signals: The build log is served from the ledger');
  await expect(entries.nth(2).locator('a.log-card')).toHaveAttribute('href', 'https://signals.oftomorrow.net/board?scope=ot.signals&card=944');
  await expect(entries.nth(1)).toContainText('[ccb, for todd · byollm] Decided on #960: the sidebar is the home page\'s right column');
  await expect(entries.nth(0).locator('a.log-title')).toHaveAttribute('href', 'https://oftomorrow.net/log/todd#e213');
  // Built, the live line is not there: a claim is only ever as old as the page load.
  await expect(page.getByTestId('log-live')).toHaveCount(0);
});

test('the feed\'s markup stays text, built and redrawn', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  await built(page);
  const first = page.getByTestId('log-entry').first();
  await expect(first).toContainText('The sidebar\'s <b>build log</b> <script>alert(1)</script>');
  await expect(first.locator('b, script, img')).toHaveCount(0);

  // The browser redraws when the feed has newer: same escaping.
  await page.unroute(`${FEED}**`);
  const page2 = await page.context().newPage();
  page2.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  const newer = { ...fixture.entries[0], seq: 300, title: '<img src=x onerror=alert(4)>new' };
  await page2.route(`${FEED}**`, (route) =>
    route.fulfill({ json: { entries: [newer, ...todds.slice(0, 9)], live: fixture.live } }),
  );
  await page2.goto('/');
  await expect(page2.getByTestId('log-entry').first()).toHaveAttribute('data-seq', '300');
  await expect(page2.getByTestId('log-entry').first()).toContainText('<img src=x onerror=alert(4)>new');
  await expect(page2.getByTestId('log-sidebar').locator('img, script:not([type]), b, i')).toHaveCount(0);
  await expect(page2.getByTestId('log-live')).toContainText('ccs is on #915 for 37m <script>alert(3)</script>');
  expect(dialogs).toEqual([]);
});

test('the browser puts the live line on top when something is claimed', async ({ page }) => {
  await page.goto('/');
  const live = page.getByTestId('log-live');
  await expect(live).toHaveCount(1);
  await expect(live).toContainText('ccs is on #915 for 37m');
  await expect(live.locator('a.log-card')).toHaveAttribute('href', 'https://signals.oftomorrow.net/board?scope=ot.signals&card=915');
  // Above the entries.
  const [l, e] = await Promise.all([live.boundingBox(), page.getByTestId('log-entry').first().boundingBox()]);
  expect(l!.y).toBeLessThan(e!.y);
  await expect(page.getByTestId('log-entry')).toHaveCount(10);
});

test('nothing claimed, no live line — absent, not "idle"', async ({ page }) => {
  await page.route(`${FEED}**`, (route) => route.fulfill({ json: { entries: todds, live: [] } }));
  const read = page.waitForResponse((r) => r.url().startsWith(FEED));
  await page.goto('/');
  await read;
  await expect(page.getByTestId('log-live')).toHaveCount(0);
  await expect(page.locator('[data-live]')).toBeHidden();
  await expect(page.getByTestId('log-entry')).toHaveCount(10);
});

test('the browser asks the feed for todd\'s ten with the live line', async ({ page }) => {
  const read = page.waitForRequest((r) => r.url().startsWith(FEED));
  await page.goto('/');
  const url = new URL((await read).url());
  expect(Object.fromEntries(url.searchParams)).toEqual({ person: 'todd', limit: '10', live: '1' });
});
