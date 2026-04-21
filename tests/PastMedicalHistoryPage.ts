import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PastMedicalHistoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForPageLoad() {
    await expect(this.page.getByRole('heading', { name: 'Past Medical History' })).toBeVisible({ timeout: 15000 });
  }

  async setSmokingStatus(status: string, packYears?: string) {
    const statusCombobox = this.page.getByRole('combobox').filter({ hasText: 'Select status' });
    await statusCombobox.click();
    await this.page.getByRole('option', { name: status }).click();
    if (packYears) {
      await this.page.getByPlaceholder('e.g. 10').fill(packYears);
    }
  }

  async setAlcoholUse(usage: string) {
    await this.page.getByRole('combobox').filter({ hasText: 'Select usage' }).click();
    await this.page.getByRole('option', { name: usage }).click();
  }

  async setLivingSituation(situation: string) {
    await this.page.getByRole('combobox').filter({ hasText: 'Select' }).click();
    await this.page.getByRole('option', { name: situation }).click();
  }

  async clickConditionCard(condition: string) {
    await this.page.locator('div').filter({ hasText: new RegExp(`^${condition}$`) }).click();
  }

  async checkConditionBox(condition: string) {
    await this.page.getByRole('checkbox', { name: condition }).check();
  }

  async continueToPhysicalExam() {
    await Promise.all([
      this.waitForNetworkIdle(),
      this.page.getByRole('button', { name: 'Continue to Physical Exam' }).click()
    ]);
  }
}