import { expect, test } from '@playwright/test';
import { PAGE_PATHS } from '../app/lib/page-paths';

// An owner-wording placeholder is an ALL_CAPS key of three or more
// underscore-joined words (for example SOME_PAGE_HEADING). One reached the
// live privacy notice as raw text; this fails if any page renders one.
const PLACEHOLDER_KEY = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){2,}\b/g;

for (const path of PAGE_PATHS) {
  test(`${path} renders no raw placeholder key`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    const title = await page.title();
    const description =
      (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    const found = [text, title, description].flatMap((s) => s.match(PLACEHOLDER_KEY) ?? []);
    expect(found, `raw placeholder keys on ${path}`).toEqual([]);
  });
}
