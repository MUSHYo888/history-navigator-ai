import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AssessmentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async answerQuestionByRadio(optionLabel: string) {
    await this.page.getByRole('radio', { name: optionLabel }).click();
    await this.page.getByRole('button', { name: 'Next Question' }).click();
  }

  async answerQuestionByText(optionText: string, exactMatch: boolean = false) {
    if (exactMatch) {
      await this.page.locator('div').filter({ hasText: new RegExp(`^${optionText}$`) }).click();
    } else {
      await this.page.getByText(optionText).click();
    }
    await this.page.getByRole('button', { name: 'Next Question' }).click();
  }

  async setSeverityScaleAndContinue() {
    await this.page.locator('.relative.h-2').click();
    await this.page.getByRole('button', { name: 'Continue to Review of Systems' }).click();
  }

  async answerAdaptiveQuestion(optionText: string) {
    const followUp = this.page.getByText(optionText);
    await followUp.waitFor({ state: 'visible', timeout: 15000 });
    await followUp.click({ force: true });
    await this.page.getByRole('button', { name: 'Next Question' }).click();
  }

  async continueToReviewOfSystems() {
    await this.page.getByRole('button', { name: 'Continue to Review of Systems' }).click();
  }
}