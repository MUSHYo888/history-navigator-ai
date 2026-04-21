import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PhysicalExaminationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillVitalSigns(vitals: { bp: string; hr: string; rr: string; temp: string; o2: string }) {
    await this.page.getByRole('textbox', { name: 'Blood Pressure' }).fill(vitals.bp);
    await this.page.getByRole('textbox', { name: 'Heart Rate' }).fill(vitals.hr);
    await this.page.getByRole('textbox', { name: 'Respiratory Rate' }).fill(vitals.rr);
    await this.page.getByRole('textbox', { name: 'Temperature' }).fill(vitals.temp);
    await this.page.getByRole('textbox', { name: 'Oxygen Saturation' }).fill(vitals.o2);
  }

  async fillGeneralAppearance(description: string) {
    await this.page.getByRole('tab', { name: 'General' }).click();
    await this.page.getByRole('textbox', { name: /describe patient/i }).fill(description);
  }

  async navigateToSystemsTab() {
    const systemsTab = this.page.getByRole('tab', { name: 'Systems' });
    await systemsTab.waitFor({ state: 'visible' });
    await systemsTab.click();
  }

  async clickFinding(findingLabel: string) {
    await this.page.getByLabel(findingLabel).click();
  }

  async markSystemNormal(systemPrefix: string) {
    await this.page.locator(`#${systemPrefix}-normal`).click({ force: true });
  }

  async continueToAssessmentAndPlan() {
    await Promise.all([
      this.waitForNetworkIdle(),
      this.page.getByRole('button', { name: 'Continue to Assessment & Plan' }).click()
    ]);
  }
}