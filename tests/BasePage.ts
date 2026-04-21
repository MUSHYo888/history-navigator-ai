import { Page } from '@playwright/test';

export class BasePage {
  constructor(public readonly page: Page) {}

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}