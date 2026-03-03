# CDS635 Simulation Engine Specification

## 1. Document Purpose
This specification defines the required behavior of the CDS635 Cyber Threat Assessment simulation engine, including user interface requirements, decision workflow, API contracts, evidence generation, and validation criteria.

This simulation is a **decision-making environment** (not a technical lab). It must support authentic analyst-style judgment under uncertainty while producing verifiable completion evidence.

## 2. Scope
### In Scope
- Weekly, browser-based simulation sessions.
- Student progression from scenario briefing to final assessment completion.
- Required decision capture (hypothesis, risk, confidence, branching choices).
- Immutable completion output suitable for screenshot verification.
- Downloadable evidence artifacts.

### Out of Scope
- Automatic grading of analytic quality.
- “Correct answer” disclosure.
- External software dependencies, plugins, or local lab installs.

## 3. Core Principles
1. **Authenticity:** Reflect operational threat-analysis decision workflows.
2. **Rigor:** Require structured decisions before completion.
3. **Neutrality:** Permit defensible alternative judgments.
4. **Verifiability:** Produce tamper-resistant completion evidence.
5. **Accessibility:** Work on modern PC and Mac browsers without extra software.

## 4. User Roles
- **Student (primary):** Completes weekly simulation and submits proof of completion.
- **Instructor/Verifier (secondary):** Reviews screenshot and/or downloaded artifact for authenticity checks.

## 5. End-to-End Experience
The simulation must guide students through these ordered stages:
1. Scenario Briefing
2. Evidence Review
3. Decision Selection
4. Assessment Complete

Progression must be explicit and linear at minimum, with optional branching inside evidence/decision stages.

---

## 6. UI Specification

## 6.1 Global UI Requirements
- Responsive web interface compatible with current versions of major browsers on PC and Mac.
- Clear stage indicator (e.g., stepper or progress bar) with active stage highlighting.
- Persistent session context display (e.g., scenario title, student display name).
- Readable typography and contrast meeting standard accessibility expectations.
- No requirement for external software.

## 6.2 Screen A: Scenario Briefing
**Purpose:** Introduce scenario context and mission objective.

**Required Elements:**
- Scenario title and briefing narrative.
- Start Session action that begins timing.
- Brief instructions emphasizing structured analytic reasoning.

**Rules:**
- Timer starts only when session is explicitly started.
- Student cannot skip directly to completion from this screen.

## 6.3 Screen B: Evidence Review
**Purpose:** Present uncertain or incomplete information for analysis.

**Required Elements:**
- Evidence items (reports, indicators, timelines, statements, etc.).
- Mechanism to inspect details of each item.
- Optional branch prompts (e.g., choose which lead to pursue).

**Rules:**
- Branch decisions must be recorded if made.
- Interface should encourage comparison/synthesis, not passive reading only.

## 6.4 Screen C: Decision Selection
**Purpose:** Capture mandatory analytical judgments.

**Required Inputs (all mandatory):**
1. Primary Hypothesis (single selection from scenario-defined options or validated free-text when configured)
2. Risk Level: `Low | Medium | High | Critical`
3. Confidence Level: `Low | Medium | High`

**Rules:**
- Completion action is disabled until all required selections are valid.
- System must not auto-select defaults that could allow accidental completion.
- UI may allow review and revision prior to finalization.

## 6.5 Screen D: Assessment Complete (Final Verification Screen)
**Purpose:** Provide one-view completion evidence for screenshot submission.

**Mandatory Display Fields (single view, no scrolling required if feasible):**
1. Student identification (displayed name)
2. Date stamp (system-generated)
3. Time stamp (system-generated)
4. Total session duration (minutes on task)
5. Unique session ID (system-generated, unique per attempt)
6. Selected primary hypothesis
7. Selected risk level
8. Selected confidence level
9. Any branching decisions made during simulation

**Visual Requirement:**
- Clear “Assessment Complete” status indicator (heading/banner/badge).

**Immutability Requirement:**
- Final screen content must be non-editable by the student in UI controls.
- No editable fields, toggles, or selectors on the final screen.

**Evidence Requirement:**
- Screen must be suitable for one screenshot capture used for weekly verification.
- Include downloadable artifact option(s), e.g. JSON/PDF/TXT summary.

---

## 7. Decision Flow and State Machine

## 7.1 Canonical States
- `NOT_STARTED`
- `IN_BRIEFING`
- `IN_EVIDENCE_REVIEW`
- `IN_DECISION_SELECTION`
- `COMPLETED`

## 7.2 Allowed Transitions
- `NOT_STARTED -> IN_BRIEFING`
- `IN_BRIEFING -> IN_EVIDENCE_REVIEW`
- `IN_EVIDENCE_REVIEW -> IN_DECISION_SELECTION`
- `IN_DECISION_SELECTION -> COMPLETED`

Optional internal branching can occur during evidence review and decision preparation, but cannot bypass mandatory inputs.

## 7.3 Completion Gate Conditions
Transition to `COMPLETED` is permitted only if:
- Session start time exists.
- Primary hypothesis exists.
- Risk level is one of allowed values.
- Confidence level is one of allowed values.
- Session ID exists and is unique.

If any condition fails, completion must be blocked and validation guidance shown.

---

## 8. Data Model Requirements

## 8.1 Session Record (minimum)
- `sessionId` (string, globally unique for attempt)
- `studentDisplayName` (string, non-empty)
- `scenarioId` (string)
- `startedAt` (ISO-8601 timestamp)
- `completedAt` (ISO-8601 timestamp, nullable until complete)
- `durationMinutes` (integer >= 0)
- `primaryHypothesis` (string)
- `riskLevel` (`Low|Medium|High|Critical`)
- `confidenceLevel` (`Low|Medium|High`)
- `branchDecisions` (array of objects/strings)
- `status` (`NOT_STARTED|IN_BRIEFING|IN_EVIDENCE_REVIEW|IN_DECISION_SELECTION|COMPLETED`)

## 8.2 Branch Decision Record (minimum)
- `branchId` (string)
- `prompt` (string)
- `selectedOption` (string)
- `timestamp` (ISO-8601 timestamp)

## 8.3 Derived Fields
- `durationMinutes = floor((completedAt - startedAt) / 60 seconds)`
- Date stamp and time stamp rendered from `completedAt` using platform locale policy.

---

## 9. API Expectations (Implementation-Agnostic Contract)

The engine must expose equivalent behavior whether implemented as REST, RPC, or internal service functions.

## 9.1 Create Session
**Operation:** `POST /api/simulations/{scenarioId}/sessions`

**Input (minimum):**
- `studentDisplayName`

**Output (minimum):**
- `sessionId`
- `status`
- `startedAt`

**Requirements:**
- Generate unique `sessionId` per attempt.
- Initialize state and timing.

## 9.2 Retrieve Session
**Operation:** `GET /api/sessions/{sessionId}`

**Output:**
- Full current session state including decisions captured so far.

## 9.3 Record Branch Decision
**Operation:** `POST /api/sessions/{sessionId}/branches`

**Input:**
- `branchId`
- `selectedOption`

**Output:**
- Updated `branchDecisions` list.

## 9.4 Record Final Decisions
**Operation:** `POST /api/sessions/{sessionId}/assessment`

**Input:**
- `primaryHypothesis`
- `riskLevel`
- `confidenceLevel`

**Validation:**
- Reject invalid enum values.
- Reject empty hypothesis when required.

## 9.5 Complete Session
**Operation:** `POST /api/sessions/{sessionId}/complete`

**Behavior:**
- Validate completion gate conditions.
- Set `completedAt`, compute `durationMinutes`, transition to `COMPLETED`.
- Return final evidence payload used by UI final screen.

**Error Cases:**
- `409` if already completed.
- `422` if mandatory selections missing/invalid.
- `404` if session not found.

## 9.6 Download Evidence Artifact
**Operation:** `GET /api/sessions/{sessionId}/artifact`

**Output:**
- Downloadable file (JSON and/or PDF/TXT) containing all final-screen fields and metadata.

---

## 10. Validation and Integrity Criteria

## 10.1 Input Validation
- Student display name must be present before session creation.
- Risk and confidence must match allowed sets exactly.
- Hypothesis must be present at completion.

## 10.2 Process Validation
- Timer starts at explicit start event and ends only at completion event.
- Completion blocked until required selections provided.
- Branch decisions captured with timestamp when branch points are used.

## 10.3 Output Validation (Final Screen)
Final screen must always include all nine required completion elements from Section 6.5.

## 10.4 Uniqueness and Anti-Reuse
- Session IDs must be statistically unique per attempt (e.g., UUIDv4/ULID or equivalent).
- Attempt reuse must not produce identical IDs.

## 10.5 Tamper Resistance
- Final screen values are rendered read-only.
- Server-authoritative values must populate completion record (timestamps, duration, session ID).
- Artifact should include integrity metadata (e.g., hash/signature/version) when feasible.

---

## 11. Non-Functional Requirements
- **Cross-platform:** Must run on both PC and Mac via browser.
- **Performance:** Final screen generation should feel immediate under normal classroom network conditions.
- **Reliability:** Session data should survive transient UI refresh via persistence/reload.
- **Usability:** Clear guidance at each step; no ambiguous completion controls.
- **Accessibility:** Keyboard navigability and understandable labels for required selections.

---

## 12. Acceptance Criteria (Testable)
1. Student can complete full flow from briefing to final screen in browser on PC and Mac.
2. Completion is impossible without hypothesis, risk, and confidence selections.
3. Final screen shows all mandatory fields in one consolidated view.
4. Date/time/session ID are system-generated and shown on final screen.
5. Session duration reflects elapsed time between explicit start and completion.
6. Branching decisions (if used) appear in final output.
7. Final screen is non-editable by standard UI interaction.
8. Downloadable evidence artifact includes the same completion data as the final screen.
9. New attempt generates a different session ID.
10. Screenshot of final screen provides sufficient verification for weekly completion audit.

---

## 13. Instructor Verification Guidance (Operational)
For authenticity checks, instructors should verify alignment among:
- Student display name
- Date/time stamp
- Unique session ID
- Decision selections (hypothesis, risk, confidence)
- Branch decisions (if present)

These checks validate participation; analytic quality remains assessed in separate written assignments.

---

## 14. Compliance Statement
A CDS635 simulation implementation is compliant with this specification only if it satisfies all mandatory requirements in Sections 6.5, 7.3, 8.1, 9.5, and 12.
