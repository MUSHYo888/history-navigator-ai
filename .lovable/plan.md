

## History Pro — Comprehensive Feature Audit & Fix Plan

### Current State Summary

The app has a solid foundation with most UI components built. The core workflow (Patient → CC → HPI Questions → ROS → PMH → PE → Clinical Decision Support → Summary) exists end-to-end. However, there are critical gaps in AI integration, data persistence, and several checklist items.

### Gap Analysis by Checklist

**1. Patient & Session Setup** — Mostly complete
- Patient form, DB persistence, RLS: All working
- **GAP**: No `localStorage` persistence of `active_assessment_id` to survive page refreshes. Currently, refreshing the page loses the in-progress assessment.

**2. Chief Complaint & AI Logic** — Partial
- Selection UI with search: Working
- **GAP**: The `ai-assistant` edge function uses `GOOGLE_API` secret which does not exist. Only `OPENAI_API_KEY` and `LOVABLE_API_KEY` are configured. The function will always fail.
- **GAP**: Fallback templates exist (`FallbackDataService`) but use basic SOCRATES-style questions only for "headache" and "chest pain" — other complaints get generic questions.
- Question UI shows 1 question at a time: Working

**3. Review of Systems** — Partial
- System categories present (12 systems including HEENT, CV, Resp, GI, GU, Neuro, MSK, Skin): Working
- **GAP**: Uses checkboxes only (positive). No explicit "Negative" toggle — symptoms are implicitly negative if unchecked. The checklist calls for explicit +/- buttons.
- **GAP**: No gender-based smart filtering (e.g., hiding GU-specific symptoms based on patient gender).
- Summary integration for positive findings: Working (auto-flags in context)

**4. Past Medical History & Social** — Partial
- Conditions checklist + free-text surgeries: Working
- Medications and allergies with red badge for allergies: Working
- **GAP**: Family history is free-text only, no first-degree relative structured input.
- **GAP**: Social history is free-text only — no structured smoking (pack-years), alcohol, occupation fields.

**5. Physical Examination** — Mostly complete
- Vitals block (BP, HR, RR, Temp, SpO2): Working
- General appearance: Working
- **GAP**: No CC-focused exam adaptation (e.g., prioritizing lung/heart for SOB). All systems shown equally.
- Normal/Abnormal toggles: Working (checkbox for "Normal examination")

**6. Investigations & DDx** — Partial
- Test ordering multi-select: Working in CDS component
- **GAP**: No result entry fields or lab report upload (no Supabase Storage bucket configured)
- AI DDx generation: Edge functions exist but will fail (wrong API key name `GOOGLE_API`)
- **GAP**: Rationale and "Suggested Next Step" partially present via fallback but not from live AI

**7. Clinical Summary & Export** — Partial
- SOAP note editor: Working
- **GAP**: No visual progress bar on the assessment (progress calculated but `AssessmentProgress` usage unclear)
- PDF export button exists: Working (via `PDFExportButton`)
- **GAP**: No "Copy to Clipboard" for quick sharing
- **GAP**: No archive/"Finalized" lock to prevent further editing after completion

### Technical Gaps
- **AI Edge Functions**: Both `ai-assistant` and `differential-diagnosis` use wrong/missing API keys. Need to migrate to Lovable AI Gateway (`LOVABLE_API_KEY`) which is already available.
- **No realtime**: Dashboard does not use `supabase.channel()` for live updates.
- **ErrorBoundary**: Exists and wraps CDS. Could wrap the full assessment flow.
- **Circuit breaker**: Fallback exists but no retry-3x-then-fallback pattern.

---

### Implementation Plan

#### Step 1: Fix AI Edge Functions to use Lovable AI Gateway
Rewrite `ai-assistant/index.ts` and `differential-diagnosis/index.ts` to call `https://ai.gateway.lovable.dev/v1/chat/completions` using `LOVABLE_API_KEY` instead of `GOOGLE_API` or `OPENAI_API_KEY`. This unblocks all AI features.

#### Step 2: Add localStorage session persistence
In `Index.tsx`, save `active_assessment_id` and `active_patient_id` to `localStorage` when an assessment starts. On mount, check for an active session and offer to resume.

#### Step 3: Enhance ROS with explicit +/- toggles and gender filtering
Replace checkboxes with three-state buttons (Positive / Negative / Not Asked). Filter GU symptoms based on `state.currentPatient.gender`.

#### Step 4: Structure Social History fields
Replace the free-text social history in `PastMedicalHistory.tsx` with structured fields: Smoking status + pack-years, Alcohol use, Occupation, Living situation.

#### Step 5: Add "Copy to Clipboard" to Clinical Summary
Add a button in `ClinicalSummary.tsx` that copies the full SOAP-style note to clipboard.

#### Step 6: Add assessment finalization lock
When "Complete Assessment" is clicked, set `status = 'completed'` (already done) and add a read-only mode that prevents further edits when resuming a completed assessment.

#### Step 7: Enable Realtime on Dashboard
Add `ALTER PUBLICATION supabase_realtime ADD TABLE public.patients, public.assessments;` and subscribe to changes in the Dashboard component for live patient list updates.

#### Step 8: Add circuit breaker retry logic
Wrap AI service calls in a retry-3x utility with exponential backoff before falling back to `FallbackDataService`.

### Technical Details

- **Edge function migration**: Replace `fetch("https://generativelanguage.googleapis.com/...")` with `fetch("https://ai.gateway.lovable.dev/v1/chat/completions")` using OpenAI-compatible format and `LOVABLE_API_KEY` bearer auth. Default model: `google/gemini-3-flash-preview`.
- **localStorage keys**: `history-pro:active-assessment-id`, `history-pro:active-patient-id`
- **ROS toggle state**: `'positive' | 'negative' | null` per symptom instead of boolean
- **Realtime migration**: Single SQL migration to add tables to `supabase_realtime` publication
- **Circuit breaker**: Utility function `withRetry(fn, maxRetries=3, backoffMs=1000)` returning fallback on exhaustion

