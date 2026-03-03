# Extracted Requirements from `SIMULATION_SPEC.md`

## A) Scenario Definition Required Fields

- `scenarioId` — type: `string`; required: **yes**; enum: none. Note: inferred as required scenario identifier because sessions are created under `/api/simulations/{scenarioId}/sessions` and session records must store `scenarioId`.
- `title` — type: `string`; required: **yes**; enum: none. Note: Scenario Briefing requires “Scenario title”.
- `briefingNarrative` — type: `string`; required: **yes**; enum: none. Note: Scenario Briefing requires “briefing narrative”.
- `briefInstructions` — type: `string`; required: **yes**; enum: none. Note: Scenario Briefing requires “Brief instructions emphasizing structured analytic reasoning”.
- `evidenceItems` — type: `array` (of scenario evidence entries); required: **yes**; enum: none. Note: Evidence Review requires “Evidence items (reports, indicators, timelines, statements, etc.)”.
- `hypothesisOptions` — type: `array<string>`; required: **conditionally required** (required when hypothesis is configured as selection mode); enum: scenario-defined values. Note: Decision Selection requires “Primary Hypothesis (single selection from scenario-defined options or validated free-text when configured)”.
- `hypothesisInputMode` — type: `enum`; required: **yes**; enum: `selection | free_text_validated`. Note: Decision Selection explicitly allows either scenario-defined options or validated free text “when configured”.
- `branchPrompts` — type: `array` (branch prompt definitions); required: **no (optional)**; enum: none. Note: Evidence Review includes “Optional branch prompts”.

## B) Session Record Required Fields

- `sessionId` — type: `string`; required: **yes**; enum: none. Note: Session Record minimum requires globally unique attempt ID.
- `studentDisplayName` — type: `string`; required: **yes**; enum: none. Note: Session Record minimum requires non-empty display name.
- `scenarioId` — type: `string`; required: **yes**; enum: none. Note: Session Record minimum includes linked scenario ID.
- `startedAt` — type: `ISO-8601 timestamp`; required: **yes**; enum: none. Note: Session Record minimum includes start time.
- `completedAt` — type: `ISO-8601 timestamp`; required: **conditionally required** (nullable until complete); enum: none. Note: Session Record minimum marks it nullable until completion.
- `durationMinutes` — type: `integer >= 0`; required: **yes** (derived); enum: none. Note: Session Record minimum + Derived Fields formula.
- `primaryHypothesis` — type: `string`; required: **yes for completion**; enum: none. Note: Session Record minimum + completion gate requires hypothesis to exist.
- `riskLevel` — type: `enum`; required: **yes for completion**; enum: `Low | Medium | High | Critical`. Note: Session Record minimum + completion gate + validation rules.
- `confidenceLevel` — type: `enum`; required: **yes for completion**; enum: `Low | Medium | High`. Note: Session Record minimum + completion gate + validation rules.
- `branchDecisions` — type: `array<object|string>`; required: **yes** (may be empty if no branches used); enum: none. Note: Session Record minimum includes branch decisions collection.
- `status` — type: `enum`; required: **yes**; enum: `NOT_STARTED | IN_BRIEFING | IN_EVIDENCE_REVIEW | IN_DECISION_SELECTION | COMPLETED`. Note: Session Record minimum and canonical state machine.

### Branch Decision object (if `branchDecisions` contains objects)
- `branchId` — type: `string`; required: **yes**; enum: none.
- `prompt` — type: `string`; required: **yes**; enum: none.
- `selectedOption` — type: `string`; required: **yes**; enum: none.
- `timestamp` — type: `ISO-8601 timestamp`; required: **yes**; enum: none.
