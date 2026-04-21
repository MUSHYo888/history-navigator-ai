/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';
import { DashboardPage } from './DashboardPage';
import { AssessmentPage } from './AssessmentPage';
import { ReviewOfSystemsPage } from './ReviewOfSystemsPage';
import { PastMedicalHistoryPage } from './PastMedicalHistoryPage';
import { PhysicalExaminationPage } from './PhysicalExaminationPage';
import { ClinicalDecisionSupportPage } from './ClinicalDecisionSupportPage';
import { PatientSummaryPage } from './PatientSummaryPage';

type ClinicalFixtures = {
  dashboardPage: DashboardPage;
  assessmentPage: AssessmentPage;
  rosPage: ReviewOfSystemsPage;
  pmhPage: PastMedicalHistoryPage;
  pePage: PhysicalExaminationPage;
  cdsPage: ClinicalDecisionSupportPage;
  summaryPage: PatientSummaryPage;
};

export const test = base.extend<ClinicalFixtures>({
  // Override the default page fixture to automatically authenticate
  page: async ({ page }, use) => {
    // Just navigate to the root, storageState will handle authentication
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
  dashboardPage: async ({ page }, use) => await use(new DashboardPage(page)),
  assessmentPage: async ({ page }, use) => await use(new AssessmentPage(page)),
  rosPage: async ({ page }, use) => await use(new ReviewOfSystemsPage(page)),
  pmhPage: async ({ page }, use) => await use(new PastMedicalHistoryPage(page)),
  pePage: async ({ page }, use) => await use(new PhysicalExaminationPage(page)),
  cdsPage: async ({ page }, use) => await use(new ClinicalDecisionSupportPage(page)),
  summaryPage: async ({ page }, use) => await use(new PatientSummaryPage(page)),
});

export { expect };