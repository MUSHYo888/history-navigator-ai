import { test, expect } from './fixtures';
import testData from './data/patient-data.json';

export interface PatientTestData {
  demographics: {
    gender: string;
    name: string;
    age: string;
    location: string;
  };
  chiefComplaint: string;
  hpi: {
    onset: string;
    triggers: string;
    coughType: string;
    coughCharacter: string;
    chestPain: string;
    adaptiveQuestion: string;
  };
  ros: {
    positive: string[];
    negative: string[];
  };
  pmh: {
    smoking: { status: string; packYears: string };
    alcohol: string;
    living: string;
    condition: string;
    checkboxCondition: string;
  };
  vitals: { bp: string; hr: string; rr: string; temp: string; o2: string };
  pe: { general: string; findings: string[]; normalSystems: string[] };
  cds: { investigationDetails: string; treatmentDetails: string };
  referral: { specialty: string; urgencyLabel: string; doctor: string; facility: string; question: string };
}

for (const [scenario, data] of Object.entries(testData) as [string, PatientTestData][]) {
  test(`Clinical AI Assessment Flow - ${scenario}`, async ({ page, dashboardPage, assessmentPage, rosPage, pmhPage, pePage, cdsPage, summaryPage }) => {
    // Give the overall test a generous timeout for full end-to-end runs
    test.setTimeout(90000); 
    
    // ==========================================
    // Start New Assessment & Patient Registration
    // ==========================================
    await dashboardPage.startNewAssessment();
    
    await dashboardPage.registerPatient(data.demographics);

    await dashboardPage.enterChiefComplaint(data.chiefComplaint);

    // ==========================================
    // History of Present Illness (HPI) Phase 1
    // ==========================================
    await assessmentPage.answerQuestionByRadio(data.hpi.onset);
    await assessmentPage.answerQuestionByText(data.hpi.triggers);
    await assessmentPage.answerQuestionByText(data.hpi.coughType, true); // exact match to avoid collisions
    await assessmentPage.answerQuestionByText(data.hpi.coughCharacter);
    await assessmentPage.answerQuestionByText(data.hpi.chestPain);
    await assessmentPage.setSeverityScaleAndContinue();

    // Adaptive Questions Phase 2
    await assessmentPage.answerAdaptiveQuestion(data.hpi.adaptiveQuestion);
    await assessmentPage.continueToReviewOfSystems();

    // ==========================================
    // 6. Review of Systems (Batch Save Architecture)
    // ==========================================
    await expect(page, 'App redirected to login unexpectedly.').not.toHaveURL(/.*auth/);

    // Perform the clicks
    for (const symptom of data.ros.positive) {
      await rosPage.clickSymptom(symptom);
    }
    for (const symptom of data.ros.negative) {
      await rosPage.clickSymptom(symptom, true);
    }

    // Verify React state aggregated properly
    await rosPage.verifySymptomCounts(data.ros.positive.length, data.ros.negative.length);

    // 🚨 BATCH SAVE TRIGGER 🚨
    await rosPage.continueToSummary();

    // ==========================================
    // 7. Past Medical & Social History
    // ==========================================
    await pmhPage.waitForPageLoad();
    
    await pmhPage.setSmokingStatus(data.pmh.smoking.status, data.pmh.smoking.packYears);
    await pmhPage.setAlcoholUse(data.pmh.alcohol);
    await pmhPage.setLivingSituation(data.pmh.living);
    
    await pmhPage.clickConditionCard(data.pmh.condition);
    await pmhPage.checkConditionBox(data.pmh.checkboxCondition);
    
    // Wait for PMH batch save
    await pmhPage.continueToPhysicalExam();

    // ==========================================
    // Physical Examination
    // ==========================================
    await pePage.fillVitalSigns(data.vitals);

    await pePage.fillGeneralAppearance(data.pe.general);
    await pePage.navigateToSystemsTab();
    
    for (const finding of data.pe.findings) {
      await pePage.clickFinding(finding);
    }
    for (const system of data.pe.normalSystems) {
      await pePage.markSystemNormal(system);
    }

    // Wait for Physical Exam save
    await pePage.continueToAssessmentAndPlan();

    // ==========================================
    // 9. Clinical Decision Support (AI Generation)
    // ==========================================
    await cdsPage.waitForAIGeneration();
    await cdsPage.retryAIDiagnosis();
    await cdsPage.orderInvestigations(data.cds.investigationDetails);
    await cdsPage.setClinicalScores();
    await cdsPage.setTreatmentPlan(data.cds.treatmentDetails);
    await cdsPage.saveClinicalPlan();

    // ==========================================
    // 10. Summary and Export Documentation
    // ==========================================
    await summaryPage.waitForSummaryGeneration();
    await summaryPage.exportPDF();
    await summaryPage.createAndSaveSOAPNote();
    
    await summaryPage.generateReferralLetter(data.referral);
    
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    
    await summaryPage.copyClinicalVignette();
    await summaryPage.completeAndReturnToDashboard();
  });
}

// ==========================================
// Isolated Test: AI Fallback / Offline Mode
// ==========================================
test('AI Fallback Mode - API Failure Simulation', async ({ page, dashboardPage }) => {
  // 🚨 NETWORK INTERCEPTION: MOCK THE AI API TO FAIL 🚨
  // This traps all outgoing requests to Groq and immediately returns a 500 Server Error
  await page.route('https://api.groq.com/**', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Simulated API Outage for Testing' } })
    });
  });

  await dashboardPage.startNewAssessment();
  await dashboardPage.registerPatient(testData.defaultPatient.demographics);
  
  // We use "headache" because FallbackDataService has a specific hardcoded question for it
  await dashboardPage.enterChiefComplaint('headache');
  
  // Due to our withRetry logic, the app will attempt 3 times (taking ~3 seconds)
  // before automatically switching to FallbackDataService.
  // We assert that the exact fallback question successfully renders!
  await page.getByText('How did the headache begin?').waitFor({ state: 'visible', timeout: 15000 });
});