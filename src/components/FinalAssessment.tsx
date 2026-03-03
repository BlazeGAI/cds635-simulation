'use client';

type BranchDecision = {
  branchId: string;
  prompt: string;
  selectedOption: string;
  timestamp: string;
};

type FinalAssessmentProps = {
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
      </div>
      <div className="no-print">
        <button onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}
