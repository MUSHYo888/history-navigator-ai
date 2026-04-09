

## Problem: CDS Loading State Never Resolves

### Root Cause

In `ClinicalDecisionSupport.tsx` (line 92-97), the `useInvestigationRecommendations` hook is called with an inline `[]` literal for `differentialDiagnoses`:

```ts
const { recommendations, redFlags, guidelines, loading: aiLoading, error: aiError } =
  useInvestigationRecommendations(chiefComplaint, [], state.answers, state.rosData);
```

Inside the hook (`useInvestigationRecommendations.ts` line 85), the `useEffect` depends on `[chiefComplaint, differentialDiagnoses, answers, rosData]`. Since `[]` is a new array reference on every render, the effect re-triggers every render, which calls `fetchRecommendations`, which sets `loading = true`, which causes a re-render, creating an infinite loop.

Additionally, `loadClinicalData` in CDS runs whenever `recommendations` changes (line 99-101), and itself sets `loading = true` (line 134), compounding the problem. The guard at line 310 (`if (loading || aiLoading)`) keeps the loading screen permanently visible.

### Fix Plan

**File 1: `src/hooks/useInvestigationRecommendations.ts`**
- Serialize the `useEffect` dependencies to prevent object/array identity from triggering re-runs. Replace the dependency array with stable values: `chiefComplaint` (string, stable), and `JSON.stringify` of `differentialDiagnoses`, `answers`, and `rosData`. This stops the infinite re-fetch loop.

**File 2: `src/components/ClinicalDecisionSupport.tsx`**
- Memoize the empty `differentialDiagnoses` array with `useMemo` so it has a stable identity (belt-and-suspenders fix).
- In `loadClinicalData`, only set `loading = true` if `recommendations` is non-empty, preventing a loading flash on the initial empty-array state.

### Technical Details

In `useInvestigationRecommendations.ts`, change line 85 from:
```ts
}, [chiefComplaint, differentialDiagnoses, answers, rosData]);
```
to:
```ts
}, [chiefComplaint, JSON.stringify(differentialDiagnoses), JSON.stringify(answers), JSON.stringify(rosData)]);
```

In `ClinicalDecisionSupport.tsx`:
- Add `const emptyDiagnoses = useMemo(() => [], []);` and pass it to the hook.
- Guard `loadClinicalData` to skip the `setLoading(true)` call when `recommendations.length === 0`, since there is nothing to process yet.

