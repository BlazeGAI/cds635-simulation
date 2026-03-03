import Link from 'next/link';

const weeklySimulations = [
  {
    week: 1,
    title: 'Foundations of Intelligence',
    description:
      'Differentiate indicators from intelligence, evaluate confidence, and build a defensible working hypothesis from early evidence.',
  },
  {
    week: 2,
    title: 'Adversarial Modeling',
    description:
      'Assess actor intent and capability, anticipate likely next moves, and prioritize collection to reduce uncertainty.',
  },
  {
    week: 3,
    title: 'Attack Lifecycle Reconstruction',
    description:
      'Reconstruct a multi-stage intrusion, identify where detections failed, and determine mitigation breakpoints to disrupt progression.',
  },
  {
    week: 4,
    title: 'Detection Engineering and SIEM Optimization',
    description:
      'Design and refine SIEM logic, balance alert tuning tradeoffs, and identify telemetry gaps affecting detection quality.',
  },
  {
    week: 5,
    title: 'Network Behavior Analysis',
    description:
      'Distinguish beaconing, exfiltration, and benign activity by analyzing network patterns and encrypted metadata clues.',
  },
  {
    week: 6,
    title: 'Integrated Capstone',
    description:
      'Work through a multi-source scenario, separate signal from noise, and prioritize risk-informed mitigations.',
  },
  {
    week: 7,
    title: 'Emerging Threats and Strategic Response',
    description:
      'Evaluate AI-enabled threats, map governance controls, and identify strategic detection and response gaps.',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="card">
        <h1>CDS635 Cyber Threat Intelligence Simulation Lab</h1>
        <p className="lead-text">
          This simulation environment supports structured cyber threat intelligence practice across seven weekly scenarios. Each
          simulation is designed to strengthen analytical reasoning, evidence interpretation, and defensible decision-making.
        </p>
      </section>

      <section className="card" aria-labelledby="how-to-use-heading">
        <h2 id="how-to-use-heading">How to use this simulation</h2>
        <ol className="instruction-list">
          <li>Enter any display name.</li>
          <li>Click Start to begin timing.</li>
          <li>Review evidence and make decisions.</li>
          <li>Complete final selections.</li>
          <li>Screenshot the “Assessment Complete” screen for the forum.</li>
          <li>Download the evidence pack for the Sunday report (if implemented).</li>
        </ol>
      </section>

      <section className="card" aria-labelledby="weeks-heading">
        <div className="section-header">
          <h2 id="weeks-heading">Weekly simulations</h2>
          <p>Select a week to launch its scenario workflow.</p>
        </div>
        <div className="weeks-grid">
          {weeklySimulations.map((item) => (
            <article className="week-card" key={item.week}>
              <div className="status-row">
                <p className="week-label">Week {item.week}</p>
                <span className="status-badge">Ready</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link className="button-link" href={`/week/${item.week}`}>
                Open Week {item.week} Simulation
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="disclaimer-heading">
        <h2 id="disclaimer-heading">Disclaimer</h2>
        <ul>
          <li>This simulation is a decision-making exercise; there may be multiple defensible answers.</li>
          <li>Do not enter sensitive personal data.</li>
        </ul>
      </section>
    </main>
  );
}
