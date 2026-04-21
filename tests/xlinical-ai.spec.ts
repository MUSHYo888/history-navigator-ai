import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  test.setTimeout(60000);
  
  // Authentication
  await page.goto('/auth');
  await page.getByRole('textbox', { name: 'Email' }).fill('muslimkaki@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');

  // Wait for the network to calm down and WebSockets to connect
  await page.waitForLoadState('networkidle');

  // Start New Assessment
  await page.getByRole('button', { name: 'New Patient Assessment' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'New Patient Assessment' }).click();

  // Patient Registration
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Female' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('ewerty');
  await page.getByRole('spinbutton', { name: 'Age *' }).fill('55');
  await page.locator('div').filter({ hasText: /^Location\/Ward \*$/ }).click();
  await page.getByRole('textbox', { name: 'Location/Ward *' }).fill('eghjkl');
  await page.getByRole('button', { name: 'Create Patient' }).click();

  // Chief Complaint
  await page.getByRole('textbox', { name: 'Enter custom chief complaint' }).fill('coughing');
  await page.getByRole('button', { name: 'Continue' }).click();

  // History of Present Illness (HPI) Phase 1
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

  // Severity Scale
  await page.locator('.relative.h-2').click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // Adaptive Questions Phase 2
  const followUp = page.getByText('No recent major events');
  await followUp.waitFor({ state: 'visible', timeout: 15000 });
  await followUp.click({ force: true });
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // Review of Systems - Record positive and negative findings
  // 1. Before starting the symptoms, ensure we are on the right page
  await expect(page, 'App redirected to login unexpectedly.').not.toHaveURL(/.*auth/);

  // 1. Improved Symptom Helper (Waiting for the App's 'Pulse')
  const clickSymptom = async (name: string, isNegative = false) => {
    const symptomRow = page.locator('div').filter({ hasText: new RegExp(`^${name}$`) }).locator('..');
    const button = isNegative ? symptomRow.getByRole('button').last() : symptomRow.getByRole('button').first();

    // Perform the click
    await button.click({ force: true });

    // Post-Op Verification: Wait for the app to acknowledge the save
    // This prevents the 'State Overwrite' by forcing the robot to wait for the app
    await expect(page.getByText('Answer saved').first()).toBeVisible();
    
    // Wait for the toast to start disappearing so the next one can trigger
    await page.waitForTimeout(400);
  };

  // 2. Perform the Batch Assessment
  await clickSymptom('Fever');
  await clickSymptom('Chills');
  await clickSymptom('Headache');
  await clickSymptom('Vision changes', true);
  await clickSymptom('Hearing loss', true);

  // 3. Final Verification: The counters should now be accurate
  await expect(page.getByText('3 Positive')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('2 Negative')).toBeVisible({ timeout: 15000 });

  // Let pending Supabase saves finish before navigating
  await page.waitForTimeout(2000);

  // 4. Proceed to Summary
  await page.getByRole('button', { name: 'Continue to Assessment Summary' }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'Past Medical History' })).toBeVisible({ timeout: 15000 });

  // Past Medical & Social History
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
  await page.getByRole('button', { name: 'Continue to Physical Exam' }).click();

  // Physical Examination
  await page.getByRole('textbox', { name: 'Blood Pressure' }).fill('120/70');
  await page.getByRole('textbox', { name: 'Heart Rate' }).fill('75');
  await page.getByRole('textbox', { name: 'Respiratory Rate' }).fill('20');
  await page.getByRole('textbox', { name: 'Temperature' }).fill('98');
  await page.getByRole('textbox', { name: 'Oxygen Saturation' }).fill('94');

  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('textbox', { name: /describe patient/i }).fill('Patient is alert and stable.');

  // Ensure the "Systems" tab is ready before clicking
  const systemsTab = page.getByRole('tab', { name: 'Systems' });
  await systemsTab.waitFor({ state: 'visible' });
  await systemsTab.click();
  
  await page.getByLabel('Wheezes').click();
  await page.getByLabel('Crackles/rales').click();
  await page.locator('#cardiovascular-normal').click({ force: true });
  await page.locator('#abdomen-normal').click();
  await page.locator('#neurological-normal').click();
  await page.locator('#musculoskeletal-normal').click();

  await page.getByRole('button', { name: 'Continue to Assessment & Plan' }).click();

  // Wait for AI generation to finish
  await expect(page.getByText(/Generating/)).toHaveCount(0, { timeout: 80000 });

  // Clinical Decision Support
  await page.getByRole('tab', { name: 'AI Diagnosis' }).click();
  await page.getByRole('button', { name: 'Retry' }).click();
  
  const investigationsTab = page.getByRole('tab', { name: 'Investigations' });
  await investigationsTab.waitFor({ state: 'visible' });
  await investigationsTab.click({ force: true });
  await page.getByRole('checkbox').first().check({ force: true });
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Provide detailed clinical' }).fill('goodsdfghjkl;');
  await page.getByRole('tab', { name: 'Clinical Scores' }).click();
  await page.getByRole('checkbox', { name: 'Clinical signs of DVT' }).check({ force: true });
  await page.getByRole('tab', { name: 'Treatment & Management' }).click();
  await page.getByRole('checkbox').first().check({ force: true });
  await page.locator('div').filter({ hasText: /^Physical therapy$/ }).click();
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Outline specific follow-up' }).fill('xcfvghjkl;\'');
  await page.getByRole('button', { name: 'Save Clinical Plan' }).click();

  // Handle loading state to ensure patient summary has finished generating
  await expect(page.getByText('Generating Patient Summary')).toBeHidden({ timeout: 60000 });
  const finalButton = page.getByRole('button', { name: /(Skip to Summary|Complete Assessment)/ });
  await finalButton.waitFor({ state: 'visible' });
  await finalButton.click();

  // Summary and Export Documentation
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const download = await downloadPromise;
  await page.getByRole('button', { name: 'Create SOAP Note' }).click();
  await page.getByRole('button', { name: 'Save SOAP Note' }).click();
  await page.getByRole('button', { name: 'Generate Referral Letter' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select specialty' }).click();
  await page.getByRole('option', { name: 'Cardiology' }).click();
  await page.getByRole('combobox').filter({ hasText: 'RoutineStandard referral' }).click();
  await page.getByRole('option', { name: 'Routine Standard referral' }).click();
  await page.getByRole('textbox', { name: 'Recipient Doctor (Optional)' }).fill('dfghjk');
  await page.getByRole('textbox', { name: 'Facility (Optional)' }).fill('cvgbhnjkl;');
  await page.getByRole('textbox', { name: 'Clinical Question *' }).fill('Please evaluate for coronary artery diseasdfghjkl;\'\nase and provide risk stratification');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await page.getByRole('button', { name: 'Save Referral Letter' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Copy as Clinical Vignette' }).click();
  await page.getByRole('button', { name: 'Complete Assessment' }).click();
  await page.getByRole('button', { name: 'Return to Dashboard' }).click();
});