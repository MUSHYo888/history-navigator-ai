import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClinicalDecisionSupportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForAIGeneration() {
    await expect(this.page.getByText(/Generating/)).toHaveCount(0, { timeout: 80000 });
  }

  async retryAIDiagnosis() {
    await this.page.getByRole('tab', { name: 'AI Diagnosis' }).click();
    await this.page.getByRole('button', { name: 'Retry' }).click();
  }

  async orderInvestigations(clinicalDetails: string) {
    const investigationsTab = this.page.getByRole('tab', { name: 'Investigations' });
    await investigationsTab.waitFor({ state: 'visible' });
    await investigationsTab.click({ force: true });
    await this.page.getByRole('checkbox').first().check({ force: true });
    await this.page.getByRole('checkbox').nth(1).check({ force: true });
    await this.page.getByRole('textbox', { name: 'Provide detailed clinical' }).fill(clinicalDetails);
  }

  async setClinicalScores() {
    await this.page.getByRole('tab', { name: 'Clinical Scores' }).click();
    await this.page.getByRole('checkbox', { name: 'Clinical signs of DVT' }).check({ force: true });
  }

  async setTreatmentPlan(followUpDetails: string) {
    await this.page.getByRole('tab', { name: 'Treatment & Management' }).click();
    await this.page.getByRole('checkbox').first().check({ force: true });
    await this.page.locator('div').filter({ hasText: /^Physical therapy$/ }).click();
    await this.page.getByRole('checkbox').nth(1).check({ force: true });
    await this.page.getByRole('textbox', { name: 'Outline specific follow-up' }).fill(followUpDetails);
  }

  async saveClinicalPlan() {
    await this.page.getByRole('button', { name: 'Save Clinical Plan' }).click();
  }
}