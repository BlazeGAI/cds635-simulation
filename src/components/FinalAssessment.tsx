'use client';

import { useMemo } from 'react';
import { formatDimensionLabel, generateFeedback } from '@/src/lib/feedback';

type BranchDecision = {
  branchId: string;
  prompt: string;
  selectedOption: string;
  timestamp: string;
};

type FinalAssessmentProps = {
  scenarioId: string;
  studentDisplayName: string;
  completedAt: string;
  durationMinutes: number;
  sessionId: string;
  primaryHypothesis: string;
  riskLevel: string;
  confidenceLevel: string;
  branchDecisions: BranchDecision[];
};

export default function FinalAssessment(props: FinalAssessmentProps) {
  const dt = new Date(props.completedAt);
  const feedback = useMemo(
    () =>
      generateFeedback({
        scenarioId: props.scenarioId,
        decisionLog: props.branchDecisions.map((decision) => ({
          decisionId: decision.branchId,
          prompt: decision.prompt,
          selectedOption: decision.selectedOption,
        })),
        finalSelections: {
          primaryHypothesis: props.primaryHypothesis,
          riskLevel: props.riskLevel,
          confidenceLevel: props.confidenceLevel,
        },
      }),
    [props.branchDecisions, props.confidenceLevel, props.primaryHypothesis, props.riskLevel, props.scenarioId],
  );

  return (
    <div className="card" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <h2>Assessment Complete</h2>
        <p><strong>Student:</strong> {props.studentDisplayName}</p>
        <p><strong>Date:</strong> {dt.toLocaleDateString()} <strong>Time:</strong> {dt.toLocaleTimeString()}</p>
        <p><strong>Duration (minutes):</strong> {props.durationMinutes}</p>
        <p><strong>Session ID:</strong> {props.sessionId}</p>
        <p><strong>Primary Hypothesis:</strong> {props.primaryHypothesis}</p>
        <p><strong>Risk Level:</strong> {props.riskLevel}</p>
        <p><strong>Confidence Level:</strong> {props.confidenceLevel}</p>

        <p>Your forum post summarizes the operational decision you made in the simulation.</p>
        <p>Your written report explains your reasoning using structured analysis and supporting evidence.</p>

        <h3>Branching Decisions</h3>
        {props.branchDecisions.length === 0 ? (
          <p>None</p>
        ) : (
          <ul>
            {props.branchDecisions.map((d, i) => (
              <li key={`${d.branchId}-${i}`}>
                <strong>{d.branchId}</strong>: {d.prompt} → <em>{d.selectedOption}</em>
              </li>
            ))}
          </ul>
        )}

        <details className="feedback-details" open>
          <summary>Feedback for your report</summary>

          <p>The suggestions below are intended to help you organize and strengthen your written analysis. Your report should explain and justify the decisions you made in the simulation using evidence from the scenario.</p>

          <h3>Your decision path</h3>
          <ol>
            {feedback.decisionTraceSummary.decisions.map((decision) => (
              <li key={`${decision.decisionId}-${decision.order}`}>
                <strong>{decision.prompt}</strong>: <em>{decision.selectedOption}</em>
              </li>
            ))}
          </ol>
          <ul>
            <li><strong>Primary hypothesis:</strong> {feedback.decisionTraceSummary.finalSelections.primaryHypothesis}</li>
            <li><strong>Risk level:</strong> {feedback.decisionTraceSummary.finalSelections.riskLevel}</li>
            <li><strong>Confidence level:</strong> {feedback.decisionTraceSummary.finalSelections.confidenceLevel}</li>
          </ul>

          <h3>What your decisions suggest</h3>
          <ul>
            {feedback.implications.map((item, idx) => <li key={`implication-${idx}`}>{item}</li>)}
          </ul>

          <h3>Ideas to strengthen your report</h3>
          <p><strong>Core sections</strong></p>
          <ul>
            {feedback.reportChecklist.coreSections.map((section) => (
              <li key={section.title}>
                <strong>{section.title}:</strong> {section.template}
              </li>
            ))}
          </ul>

          {feedback.reportChecklist.missingDimensions.length > 0 && (
            <>
              <p><strong>Coverage gaps to address</strong></p>
              <ul>
                {feedback.reportChecklist.missingDimensions.map((dimension) => (
                  <li key={dimension}>
                    <strong>{formatDimensionLabel(dimension)}:</strong> {feedback.coverageByDimension[dimension]?.description}
                  </li>
                ))}
              </ul>
            </>
          )}

          {feedback.reportChecklist.gapPrompts.length > 0 && (
            <>
              <p><strong>Gap prompts</strong></p>
              <ul>
                {feedback.reportChecklist.gapPrompts.map((prompt, idx) => <li key={`gap-${idx}`}>{prompt}</li>)}
              </ul>
              <p><em>Tip: You do not need to address every suggestion. Use the ideas that best strengthen your explanation and evidence-based reasoning.</em></p>
            </>
          )}

          <p><strong>Tailored prompts</strong></p>
          <ul>
            {feedback.reportChecklist.tailoredPrompts.map((prompt, idx) => <li key={`tailored-${idx}`}>{prompt}</li>)}
          </ul>
        </details>
      </div>
      <div className="no-print">
        <button onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}
