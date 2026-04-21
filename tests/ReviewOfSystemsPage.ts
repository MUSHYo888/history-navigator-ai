import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReviewOfSystemsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickSymptom(name: string, isNegative = false) {
    const symptomRow = this.page.locator('div').filter({ hasText: new RegExp(`^${name}$`) }).locator('..');
    const button = isNegative ? symptomRow.getByRole('button').last() : symptomRow.getByRole('button').first();
    await button.click({ force: true });
  }

  async verifySymptomCounts(positiveCount: number, negativeCount: number) {
    await expect(this.page.getByText(`${positiveCount} Positive`)).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByText(`${negativeCount} Negative`)).toBeVisible({ timeout: 5000 });
  }

  async continueToSummary() {
    const continueSummaryBtn = this.page.getByRole('button', { name: 'Continue to Assessment Summary' });
    await Promise.all([
      this.waitForNetworkIdle(), 
      continueSummaryBtn.click({ force: true })
    ]);
  }
}