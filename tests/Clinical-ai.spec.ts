import { test, expect } from '@playwright/test';

test('Clinical AI Assessment Flow - Batch Save', async ({ page }) => {
  test.setTimeout(90000); 
  
  // ==========================================
  // 1. Authentication
  // ==========================================
  await page.goto('/auth');
  await page.getByRole('textbox', { name: 'Email' }).fill('muslimkaki@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  await page.waitForLoadState('networkidle');

  // ==========================================
  // 2. Start New Assessment & Patient Registration
  // ==========================================
  const newAssessmentBtn = page.getByRole('button', { name: 'New Patient Assessment' });
  await newAssessmentBtn.waitFor({ state: 'visible' });
  await newAssessmentBtn.click();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Female' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('Test Patient');
  await page.getByRole('spinbutton', { name: 'Age *' }).fill('55');
  await page.locator('div').filter({ hasText: /^Location\/Ward \*$/ }).click();
  await page.getByRole('textbox', { name: 'Location/Ward *' }).fill('ICU-A');
  await page.getByRole('button', { name: 'Create Patient' }).click();

  // ==========================================
  // 3. Chief Complaint & HPI
  // ==========================================
  await page.getByRole('textbox', { name: 'Enter custom chief complaint' }).fill('coughing');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('radio', { name: 'Gradual over days/weeks' }).click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('Cold air/allergens').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.locator('div').filter({ hasText: /^Chronic cough$/ }).click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('Dry cough').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('No chest pain').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.locator('.relative.h-2').click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  const followUp = page.getByText('No recent major events');
  await followUp.waitFor({ state: 'visible', timeout: 15000 });
  await followUp.click({ force: true });
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // ==========================================
  // 4. Review of Systems (The New Batch Architecture)
  // ==========================================
  await expect(page, 'App redirected to login unexpectedly.').not.toHaveURL(/.*auth/);

  // 1. The Bulletproof Click Helper
  const clickSymptom = async (name: string, isNegative = false) => {
    // We add .first() so it doesn't get confused by duplicate symptoms like "Headache"
    const symptomRow = page.getByText(name, { exact: true }).first().locator('..');
    
    // The positive button is index 0, the negative button is index 1
    const buttonIndex = isNegative ? 1 : 0;
    await symptomRow.getByRole('button').nth(buttonIndex).click();
    
    // A slightly longer human breather
    await page.waitForTimeout(300); 
  };

  // Speed-click without worrying about the database
  await clickSymptom('Fever');
  await clickSymptom('Chills');
  await clickSymptom('Headache');
  await clickSymptom('Vision changes', true);
  await clickSymptom('Hearing loss', true);

  // 🚨 FREEZE TIME: This will pause the test and open a debug window
  await page.pause();

  await expect(page.getByText('3 Positive')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('2 Negative')).toBeVisible({ timeout: 5000 });

  // 🚨 THE BATCH SAVE NETWORK LOCK 🚨
  const continueSummaryBtn = page.getByRole('button', { name: 'Continue to Assessment Summary' });
  await Promise.all([
    page.waitForLoadState('networkidle'), 
    continueSummaryBtn.click({ force: true })
  ]);

  // Wait for the button to disappear, ensuring the transition has actually occurred
  await expect(continueSummaryBtn).toBeHidden({ timeout: 15000 });

  // ==========================================
  // 5. Past Medical & Social History
  // ==========================================
  await expect(page.getByRole('heading', { name: 'Past Medical History' })).toBeVisible({ timeout: 20000 });
  
  const statusCombobox = page.getByRole('combobox').filter({ hasText: 'Select status' });
  await statusCombobox.click();
  await page.getByRole('option', { name: 'Former smoker' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select usage' }).click();
  await page.getByRole('option', { name: 'None' }).click();
  await page.getByPlaceholder('e.g. 10').fill('5');
  
  await page.getByRole('combobox').filter({ hasText: 'Select' }).click();
  await page.getByRole('option', { name: 'Lives alone' }).click();
  await page.locator('div').filter({ hasText: /^Cancer$/ }).click();
  await page.getByRole('checkbox', { name: 'Asthma' }).check();
  
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue to Physical Exam' }).click()
  ]);

  // ==========================================
  // 6. Physical Examination
  // ==========================================
  await page.getByRole('textbox', { name: 'Blood Pressure' }).fill('120/70');
  await page.getByRole('textbox', { name: 'Heart Rate' }).fill('75');
  await page.getByRole('textbox', { name: 'Respiratory Rate' }).fill('20');
  await page.getByRole('textbox', { name: 'Temperature' }).fill('98');
  await page.getByRole('textbox', { name: 'Oxygen Saturation' }).fill('94');

  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('textbox', { name: /describe patient/i }).fill('Patient is alert and stable.');

  const systemsTab = page.getByRole('tab', { name: 'Systems' });
  await systemsTab.waitFor({ state: 'visible' });
  await systemsTab.click();
  
  await page.getByLabel('Wheezes').click();
  await page.getByLabel('Crackles/rales').click();
  await page.locator('#cardiovascular-normal').click({ force: true });
  await page.locator('#abdomen-normal').click();
  await page.locator('#neurological-normal').click();
  await page.locator('#musculoskeletal-normal').click();

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue to Assessment & Plan' }).click()
  ]);

  // Rest of the flow (Summary, etc) proceeds normally...
  await expect(page.getByText(/Generating/)).toHaveCount(0, { timeout: 80000 });
});