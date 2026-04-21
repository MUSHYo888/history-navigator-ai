import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async startNewAssessment() {
    const newAssessmentBtn = this.page.getByRole('button', { name: 'New Patient Assessment' });
    await newAssessmentBtn.waitFor({ state: 'visible' });
    await newAssessmentBtn.click();
  }

  async registerPatient(details: { gender: string; name: string; age: string; location: string }) {
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: details.gender }).click();
    await this.page.getByRole('textbox', { name: 'Full Name *' }).fill(details.name);
    await this.page.getByRole('spinbutton', { name: 'Age *' }).fill(details.age);
    await this.page.locator('div').filter({ hasText: /^Location\/Ward \*$/ }).click();
    await this.page.getByRole('textbox', { name: 'Location/Ward *' }).fill(details.location);
    await this.page.getByRole('button', { name: 'Create Patient' }).click();
  }

  async enterChiefComplaint(complaint: string) {
    await this.page.getByRole('textbox', { name: 'Enter custom chief complaint' }).fill(complaint);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}