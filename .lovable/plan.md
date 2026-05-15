# Plan: Dedicated Patient Assessment Summary Page

## Problem
Clicking "View Summary" on a completed assessment navigates to `/intake?resume={id}&step=8`, which renders `ClinicalSummary` inside the intake workflow. That component reads from `MedicalContext` (`state.currentPatient`, `state.currentAssessment`, `state.answers`, `state.rosData`, etc.). When opened from the dashboard, those context fields are not hydrated, so the summary renders mostly empty.

## Solution
Create a standalone, read-only Summary page that fetches every related record from the database by `assessment_id` — independent of `MedicalContext`. Wire the dashboard's "View Summary" button to it.

## Steps

### 1. New route + page
- Add route: `/patient/:patientId/assessment/:assessmentId/summary` in `src/App.tsx` (lazy-loaded, protected).
- Create `src/pages/AssessmentSummary.tsx` that:
  - Validates UUIDs via `ClinicalUtils.isValidUUID`.
  - Uses React Query to fetch in parallel from Supabase (all already RLS-scoped):
    - `patients` (by `patientId`)
    - `assessments` (by `assessmentId`)
    - `answers` + `questions` (joined for HPI Q&A)
    - `review_of_systems`
    - `past_medical_history`
    - `physical_examination`
    - `differential_diagnoses` (ordered by probability desc)
    - `clinical_decision_support` (investigation_plan, treatment_plan, clinical_notes)
    - `soap_notes`
    - `clinical_reports` (linked lab/investigation records)
    - `referral_letters`
    - `progress_notes`
  - Shows skeleton loaders during fetch and a friendly empty state per section.
  - Strictly read-only (per project memory on completed assessments).

### 2. Presentational component
- Create `src/components/summary/AssessmentSummaryView.tsx` — pure presentational, accepts the fetched data as props. Reuses existing card/section styling. Sections:
  - Header (patient demographics, encounter date, chief complaint, status badge)
  - History of Present Illness (rendered from answers + question text)
  - Review of Systems (positive/negative per system)
  - Past Medical History (conditions, surgeries, meds, allergies, family/social)
  - Physical Examination (vitals + systems)
  - Differential Diagnoses (with probabilities, key features)
  - Investigations / Lab orders (from CDS investigation_plan + clinical_reports)
  - Treatment Plan (from CDS treatment_plan)
  - SOAP Notes (S/O/A/P sections)
  - Referral Letters (if any)
  - Progress Notes (if any)
- Print + Export PDF buttons (reuses existing `PDFExportButton` if compatible; otherwise `window.print()` only — confirm with user before adding new PDF logic).

### 3. Wire up navigation
- `src/components/PatientDetails.tsx`: change the `onViewCompletedAssessment` handler to navigate to the new route instead of `?resume=...&step=8`.
- `src/pages/PatientView.tsx`: update `onViewCompletedAssessment` to `navigate(\`/patient/\${id}/assessment/\${assessmentId}/summary\`)`.
- Leave the legacy `/intake?resume=...&step=8` path intact (no breakage for in-progress flows).

### 4. Verification
- Open a completed assessment from the dashboard → confirm all populated sections render.
- Open one with sparse data → confirm empty-state messaging instead of blank cards.
- Confirm no AI calls fire (read-only, per memory).
- Confirm no writes happen (preserves clinical integrity).

## Files touched
- `src/App.tsx` (add lazy route)
- `src/pages/AssessmentSummary.tsx` (new)
- `src/components/summary/AssessmentSummaryView.tsx` (new)
- `src/components/PatientDetails.tsx` (update navigation target)
- `src/pages/PatientView.tsx` (update navigation target)

## Open questions
1. **PDF export**: Reuse the existing `PDFExportButton`, or keep this iteration to print-only and add PDF in a follow-up?
2. **Editable vs read-only**: Confirm strictly read-only (matches project memory). Any "Add progress note" CTA wanted on this page, or keep that elsewhere?
