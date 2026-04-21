import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PatientSummaryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForSummaryGeneration() {
    await expect(this.page.getByText('Generating Patient Summary')).toBeHidden({ timeout: 60000 });
    const finalButton = this.page.getByRole('button', { name: /(Skip to Summary|Complete Assessment)/ });
    await finalButton.waitFor({ state: 'visible' });
    await finalButton.click();
  }

  async exportPDF() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: 'Export PDF' }).click();
    return await downloadPromise;
  }

  async createAndSaveSOAPNote() {
    await this.page.getByRole('button', { name: 'Create SOAP Note' }).click();
    await this.page.getByRole('button', { name: 'Save SOAP Note' }).click();
  }

  async generateReferralLetter(details: { specialty: string; urgencyLabel: string; doctor: string; facility: string; question: string }) {
    await this.page.getByRole('button', { name: 'Generate Referral Letter' }).click();
    
    await this.page.getByRole('combobox').filter({ hasText: 'Select specialty' }).click();
    await this.page.getByRole('option', { name: details.specialty }).click();
    
    await this.page.getByRole('combobox').filter({ hasText: 'RoutineStandard referral' }).click();
    await this.page.getByRole('option', { name: details.urgencyLabel }).click();
    
    await this.page.getByRole('textbox', { name: 'Recipient Doctor (Optional)' }).fill(details.doctor);
    await this.page.getByRole('textbox', { name: 'Facility (Optional)' }).fill(details.facility);
    await this.page.getByRole('textbox', { name: 'Clinical Question *' }).fill(details.question);
    
    await this.page.getByRole('button', { name: 'Download PDF' }).click();
    await this.page.getByRole('button', { name: 'Save Referral Letter' }).click();
  }

  async copyClinicalVignette() {
    await this.page.getByRole('button', { name: 'Copy as Clinical Vignette' }).click();
  }

  async completeAndReturnToDashboard() {
    await this.page.getByRole('button', { name: 'Complete Assessment' }).click();
    await this.page.getByRole('button', { name: 'Return to Dashboard' }).click();
  }
}