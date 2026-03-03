'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Scenario } from '@/src/lib/scenarios';
import FinalAssessment from './FinalAssessment';

type BranchDecisionInput = { branchId: string; prompt: string; selectedOption: string };

export default function WeekSimulationClient({ scenario, weekId }: { scenario: Scenario; weekId: string }) {
  const [step, setStep] = useState<'name' | 'briefing' | 'evidence' | 'decision' | 'final-input' | 'complete'>('name');
  const [studentDisplayName, setStudentDisplayName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState(scenario.decision_nodes[0]?.id ?? '');
  const [branchDecisions, setBranchDecisions] = useState<BranchDecisionInput[]>([]);
  const [primaryHypothesis, setPrimaryHypothesis] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [finalRecord, setFinalRecord] = useState<any>(null);
  const [startError, setStartError] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);

  const nodeById = useMemo(() => Object.fromEntries(scenario.decision_nodes.map((n) => [n.id, n])), [scenario]);
  const currentNode = nodeById[nodeId];

  async function startSession() {
    const trimmedName = studentDisplayName.trim();
    console.log('[WeekSimulationClient] Start button clicked', { scenarioId: scenario.scenarioId, studentDisplayName: trimmedName });

    if (trimmedName.length < 1) {
      setStartError('Please enter your display name before starting.');
      return;
    }

    setStartError('');
    setIsStartingSession(true);
    console.log('[WeekSimulationClient] Starting session request');

    try {
      const res = await fetch('/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentDisplayName: trimmedName, scenarioId: scenario.scenarioId }),
      });

      console.log('[WeekSimulationClient] Session request completed', { ok: res.ok, status: res.status });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        setStartError(errorPayload?.error ?? 'Unable to start session. Please try again.');
        return;
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setStartedAt(data.startedAt);
      setStep('briefing');
    } catch (error) {
      console.log('[WeekSimulationClient] Session request failed', error);
      setStartError('Unable to start session due to a network error. Please try again.');
    } finally {
      setIsStartingSession(false);
    }
  }

  async function completeSession() {
    const res = await fetch('/api/complete-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryHypothesis, riskLevel, confidenceLevel, branchDecisions }),
    });
    if (!res.ok) {
      alert('Completion failed');
      return;
    }
    const data = await res.json();
    setFinalRecord(data);
    setStep('complete');
  }

  const validPrimary =
    scenario.required_final_selections.primaryHypothesis.mode === 'freeText'
      ? primaryHypothesis.trim().length >= scenario.required_final_selections.primaryHypothesis.minLength
      : scenario.required_final_selections.primaryHypothesis.options.includes(primaryHypothesis);

  const canComplete = validPrimary && !!riskLevel && !!confidenceLevel;

  return (
    <main>
      <div className="page-intro card">
        <Link href="/" className="back-link">
          ← Back to Weeks
        </Link>
        <h1 className="week-page-title">Week {weekId}: {scenario.title}</h1>
        <p className="muted-meta">
          {sessionId ? `Session ${sessionId}` : 'Session not started'} {startedAt ? `• Started ${new Date(startedAt).toLocaleTimeString()}` : ''}
        </p>
      </div>

      <div className="stepper">
        {['Name', 'Briefing', 'Evidence', 'Decision', 'Final', 'Complete'].map((s, i) => {
          const map = ['name', 'briefing', 'evidence', 'decision', 'final-input', 'complete'];
          return <span key={s} className={`step ${map[i] === step ? 'active' : ''}`}>{s}</span>;
        })}
      </div>

      {step === 'name' && (
        <div className="card">
          <h2>Start Session</h2>
          <label>Student Display Name</label>
          <input value={studentDisplayName} onChange={(e) => setStudentDisplayName(e.target.value)} />
          {startError && <p style={{ color: '#b42318', marginTop: 8 }}>{startError}</p>}
          <button disabled={isStartingSession || !studentDisplayName.trim()} onClick={startSession}>
            {isStartingSession ? 'Starting…' : 'Start'}
          </button>
          {isStartingSession && <p style={{ marginTop: 8, fontSize: 12 }}>Starting your session…</p>}
        </div>
      )}

      {step === 'briefing' && (
        <div className="card">
          <h2>Scenario Briefing</h2>
          <p>{scenario.briefing.narrative}</p>
          <p><em>{scenario.briefing.instructions}</em></p>
          <button onClick={() => setStep('evidence')}>Continue to Evidence Review</button>
        </div>
      )}

      {step === 'evidence' && (
        <div className="card">
          <h2>Evidence Review</h2>
          {scenario.evidence_items.map((item) => (
            <div key={item.id} className="evidence-item">
              <button onClick={() => setOpenEvidenceId(openEvidenceId === item.id ? null : item.id)}>{item.id} ({item.type})</button>
              {openEvidenceId === item.id && <p>{item.content}</p>}
            </div>
          ))}
          <button onClick={() => setStep('decision')}>Continue to Decision Flow</button>
        </div>
      )}

      {step === 'decision' && currentNode && (
        <div className="card">
          <h2>Decision Flow</h2>
          <p>{currentNode.prompt}</p>
          <div className="option-stack">
            {currentNode.options.map((opt) => (
              <button
                key={opt.label}
                className="option-button"
                onClick={() => {
                  if (currentNode.recordInFinalScreen) {
                    setBranchDecisions((prev) => [...prev, { branchId: currentNode.id, prompt: currentNode.prompt, selectedOption: opt.label }]);
                  }
                  if (opt.nextNodeId) {
                    setNodeId(opt.nextNodeId);
                  } else {
                    setStep('final-input');
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'final-input' && (
        <div className="card">
          <h2>Decision Selection</h2>
          <label>Primary Hypothesis</label>
          {scenario.required_final_selections.primaryHypothesis.mode === 'freeText' ? (
            <textarea value={primaryHypothesis} onChange={(e) => setPrimaryHypothesis(e.target.value)} />
          ) : (
            <select value={primaryHypothesis} onChange={(e) => setPrimaryHypothesis(e.target.value)}>
              <option value="">Select hypothesis</option>
              {scenario.required_final_selections.primaryHypothesis.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}

          <label>Risk Level</label>
          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="">Select risk</option>
            {scenario.required_final_selections.riskLevel.allowed.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label>Confidence Level</label>
          <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)}>
            <option value="">Select confidence</option>
            {scenario.required_final_selections.confidenceLevel.allowed.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <button disabled={!canComplete} onClick={completeSession}>Complete</button>
        </div>
      )}

      {step === 'complete' && finalRecord && (
        <FinalAssessment
          studentDisplayName={finalRecord.studentDisplayName}
          completedAt={finalRecord.completedAt}
          durationMinutes={finalRecord.durationMinutes}
          sessionId={finalRecord.sessionId}
          primaryHypothesis={finalRecord.primaryHypothesis}
          riskLevel={finalRecord.riskLevel}
          confidenceLevel={finalRecord.confidenceLevel}
          branchDecisions={finalRecord.branchDecisions}
        />
      )}
    </main>
  );
}
