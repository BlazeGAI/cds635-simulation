import week1FeedbackRules from '@/feedback/week1_feedback.json';
import week2FeedbackRules from '@/feedback/week2_feedback.json';
import week3FeedbackRules from '@/feedback/week3_feedback.json';
import week4FeedbackRules from '@/feedback/week4_feedback.json';
import week5FeedbackRules from '@/feedback/week5_feedback.json';
import week6FeedbackRules from '@/feedback/week6_feedback.json';

type DecisionLogEntry = {
  decisionId: string;
  prompt: string;
  selectedOption: string;
};

type FinalSelections = {
  primaryHypothesis: string;
  riskLevel: string;
  confidenceLevel: string;
};

type FeedbackRules = {
  dimensionTags: Record<string, string[]>;
  dimensionDescriptions: Record<string, string>;
  reportSections: Array<{ title: string; template: string }>;
  gapRules: Array<{ id: string; dimension: string; minCount: number; prompt: string }>;
};

type GenerateFeedbackInput = {
  scenarioId: string;
  decisionLog: DecisionLogEntry[];
  finalSelections: FinalSelections;
};

export type GeneratedFeedback = {
  decisionTraceSummary: {
    decisions: Array<{ order: number; decisionId: string; prompt: string; selectedOption: string }>;
    finalSelections: FinalSelections;
  };
  coverageByDimension: Record<string, { count: number; description: string }>;
  implications: string[];
  reportChecklist: {
    coreSections: Array<{ title: string; template: string }>;
    missingDimensions: string[];
    gapPrompts: string[];
    tailoredPrompts: string[];
  };
};

const feedbackRulesByWeek: Record<string, FeedbackRules> = {
  '1': week1FeedbackRules as FeedbackRules,
  '2': week2FeedbackRules as FeedbackRules,
  '3': week3FeedbackRules as FeedbackRules,
  '4': week4FeedbackRules as FeedbackRules,
  '5': week5FeedbackRules as FeedbackRules,
  '6': week6FeedbackRules as FeedbackRules,
};

function getWeekKeyFromScenarioId(scenarioId: string): string {
  const normalized = scenarioId.trim().toLowerCase();
  const weekMatch = normalized.match(/week[-_]?0*(\d+)/i);

  if (weekMatch?.[1]) {
    return weekMatch[1];
  }

  const numericMatch = normalized.match(/^0*(\d+)$/);
  if (numericMatch?.[1]) {
    return numericMatch[1];
  }

  return '1';
}

function getFeedbackRules(scenarioId: string): FeedbackRules {
  const weekKey = getWeekKeyFromScenarioId(scenarioId);
  return (
    feedbackRulesByWeek[weekKey] ??
    feedbackRulesByWeek[weekKey.replace(/^0+/, '')] ??
    feedbackRulesByWeek[weekKey.toLowerCase().replace(/^week/, '')] ??
    (week1FeedbackRules as FeedbackRules)
  );
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function generateFeedback({ scenarioId, decisionLog, finalSelections }: GenerateFeedbackInput): GeneratedFeedback {
  const rules = getFeedbackRules(scenarioId);
  const coverageCounts: Record<string, number> = {};

  for (const decision of decisionLog) {
    const key = `${decision.decisionId}::${decision.selectedOption}`;
    const tags = rules.dimensionTags[key] ?? [];

    for (const tag of tags) {
      coverageCounts[tag] = (coverageCounts[tag] ?? 0) + 1;
    }
  }

  const coverageByDimension = Object.fromEntries(
    Object.entries(rules.dimensionDescriptions).map(([dimension, description]) => [
      dimension,
      { count: coverageCounts[dimension] ?? 0, description },
    ]),
  );

  const missingDimensions = Object.keys(rules.dimensionDescriptions).filter((d) => (coverageCounts[d] ?? 0) < 1);

  const implications: string[] = [];
  const supportsDimension = (dimension: string): boolean => Boolean(rules.dimensionDescriptions[dimension]);

  if (['High', 'Critical'].includes(finalSelections.riskLevel) && ['Low', 'Medium'].includes(finalSelections.confidenceLevel)) {
    implications.push('Your selections indicate urgency under uncertainty: report immediate risk implications while clearly separating confirmed findings from assumptions.');
  }

  if ((coverageCounts.mitigation ?? 0) > 0 && (coverageCounts.collection ?? 0) === 0) {
    implications.push('Your choices lean toward immediate mitigation without explicit follow-on collection, which can increase the chance of acting before key assumptions are validated.');
  }

  if (
    supportsDimension('intel') &&
    supportsDimension('network') &&
    supportsDimension('endpoint') &&
    (coverageCounts.intel ?? 0) >= 2 &&
    (coverageCounts.network ?? 0) === 0 &&
    (coverageCounts.endpoint ?? 0) === 0
  ) {
    implications.push('Your path emphasized contextual intelligence more than direct technical telemetry, so your report should call out potential endpoint and network blind spots.');
  }

  if (supportsDimension('network') && supportsDimension('intel') && (coverageCounts.network ?? 0) >= 2 && (coverageCounts.intel ?? 0) === 0) {
    implications.push('Your path emphasized local telemetry with limited external context; include how sector patterns or adversary behavior could support or challenge your interpretation.');
  }

  if (supportsDimension('detection_gap') && (coverageCounts.detection_gap ?? 0) === 0) {
    implications.push('Your selections did not explicitly surface detection gaps, so your report should include unknowns that could materially change the assessment.');
  }

  if (supportsDimension('tradeoff') && (coverageCounts.tradeoff ?? 0) === 0) {
    implications.push('Your narrative may understate operational tradeoffs; include the cost and consequence of both immediate action and delayed action.');
  }

  if (supportsDimension('adversary_modeling') && supportsDimension('collection') && (coverageCounts.adversary_modeling ?? 0) >= 2 && (coverageCounts.collection ?? 0) === 0) {
    implications.push('Your actor profile is assertive but under-collected; add one collection action that could materially falsify or confirm your model in the next reporting cycle.');
  }


  if (
    supportsDimension('detection_logic') &&
    supportsDimension('evidence_linkage') &&
    (coverageCounts.detection_logic ?? 0) > 0 &&
    (coverageCounts.evidence_linkage ?? 0) === 0
  ) {
    implications.push('You selected a detection interpretation path but did not anchor it to explicit evidence linkage; call out the exact telemetry artifacts that justify why alerts are signal versus noise.');
  }

  if (
    supportsDimension('telemetry_quality') &&
    supportsDimension('confidence_reasoning') &&
    (coverageCounts.telemetry_quality ?? 0) > 0 &&
    (coverageCounts.confidence_reasoning ?? 0) === 0
  ) {
    implications.push('You identified telemetry quality concerns without translating them into confidence reasoning; explain how missing or inconsistent fields should change certainty and decision urgency.');
  }

  if (
    supportsDimension('false_positive_management') &&
    supportsDimension('false_negative_risk') &&
    (coverageCounts.false_positive_management ?? 0) > 0 &&
    (coverageCounts.false_negative_risk ?? 0) === 0
  ) {
    implications.push('Your tuning path emphasized false-positive reduction more than false-negative exposure; include what stealth behaviors might evade detection after suppression or threshold changes.');
  }

  if (
    supportsDimension('false_negative_risk') &&
    supportsDimension('investigation_pivot') &&
    (coverageCounts.false_negative_risk ?? 0) > 0 &&
    (coverageCounts.investigation_pivot ?? 0) === 0
  ) {
    implications.push('Your path accepts meaningful false-negative risk but does not define an immediate investigative pivot; add 1–2 checks that would quickly validate whether tuning is masking active threat activity.');
  }

  if (
    supportsDimension('tuning_action') &&
    supportsDimension('mitigation_tradeoff') &&
    (coverageCounts.tuning_action ?? 0) > 0 &&
    (coverageCounts.mitigation_tradeoff ?? 0) > 0
  ) {
    implications.push('Your tuning recommendation is actionable; strengthen the report by quantifying expected alert-volume change and the specific operational tradeoff stakeholders should accept.');
  }
  if (supportsDimension('next_move') && supportsDimension('mitigation') && (coverageCounts.next_move ?? 0) > 0 && (coverageCounts.mitigation ?? 0) === 0) {
    implications.push('You projected the likely next move without committing to a mitigation path; align your forecast with a concrete defensive priority and ownership.');
  }

  if (
    supportsDimension('network_beaconing') &&
    supportsDimension('network_exfiltration') &&
    supportsDimension('benign_traffic_explanations')
  ) {
    const beaconingCount = coverageCounts.network_beaconing ?? 0;
    const exfilCount = coverageCounts.network_exfiltration ?? 0;
    const benignCount = coverageCounts.benign_traffic_explanations ?? 0;

    if (beaconingCount > exfilCount && beaconingCount >= benignCount) {
      implications.push('Your decision path leans toward beaconing behavior; strengthen this by distinguishing callback periodicity from routine scheduler-driven SaaS polling and stating what would invalidate a C2 interpretation.');
    }

    if (exfilCount > beaconingCount && exfilCount >= benignCount) {
      implications.push('Your decision path leans toward exfiltration; quantify why outbound volume, staging sequence, and destination behavior are more consistent with data theft than sanctioned bulk transfer.');
    }

    if (benignCount > beaconingCount && benignCount >= exfilCount) {
      implications.push('Your decision path leans toward benign automation; explicitly justify why suspicious overlaps (for example randomized subdomains or mixed user-agents) are acceptable under the documented operational context.');
    }
  }

  if (supportsDimension('containment_strategy') && supportsDimension('evidence_preservation') && (coverageCounts.containment_strategy ?? 0) > 0 && (coverageCounts.evidence_preservation ?? 0) > 0) {
    implications.push('Your response path includes explicit containment sequencing with evidence-preservation considerations; in the report, clarify which steps happen first and which artifacts must be captured before disruptive actions.');
  }

  if (supportsDimension('detection_gap') && (coverageCounts.detection_gap ?? 0) > 0 && (coverageCounts.prioritization ?? 0) > 0) {
    implications.push('Your selections identify a concrete detection failure and a priority action; make the causal link explicit so leadership sees how the fix reduces recurrence risk fastest.');
  }

  if (supportsDimension('tradeoff') && (coverageCounts.tradeoff ?? 0) > 0 && (coverageCounts.uncertainty_collection ?? 0) > 0) {
    implications.push('Your path balances immediate action with uncertainty-reduction; document the exact collection outcomes that would justify tightening or relaxing containment.');
  }

  if (decisionLog.some((d) => d.selectedOption.includes('pivot hosts'))) {
    implications.push('Your mitigation path centers on host containment and credential rotation; make sequencing explicit so volatile evidence is captured before isolation and egress restriction changes take effect.');
  }

  if (decisionLog.some((d) => d.selectedOption.includes('identity hardening'))) {
    implications.push('Your priority is identity control hardening; explain near-term access disruption risks and how token revocation, MFA enforcement, and exception rollback are phased to protect critical operations.');
  }

  if (decisionLog.some((d) => d.selectedOption.includes('detection resilience'))) {
    implications.push('Your priority is detection resilience; specify how suppression rollback and sensor restoration will be paired with triage capacity so alert quality improves without overwhelming responders.');
  }

  if (decisionLog.some((d) => d.selectedOption.includes('Conditional access exception'))) {
    implications.push('Your selected detection gap is identity-policy weakness; connect this to governance controls and clearly state why this failure created disproportionate business risk.');
  }

  if (decisionLog.some((d) => d.selectedOption.includes('Telemetry gaps from EDR outage'))) {
    implications.push('Your selected detection gap is telemetry outage during key movement windows; document immediate compensating controls and the order of restoration across endpoint and network visibility.');
  }

  if (implications.length < 4) {
    implications.push('Your report should connect each major choice to expected operational impact so decision-makers can see why the selected path is practical now.');
    implications.push('Frame your conclusions as a current working assessment and identify what new evidence would most likely strengthen or revise that assessment.');
  }

  const gapPrompts = rules.gapRules
    .filter((rule) => (coverageCounts[rule.dimension] ?? 0) < rule.minCount)
    .map((rule) => rule.prompt);

  if (
    supportsDimension('dns_patterns') &&
    supportsDimension('tls_metadata') &&
    supportsDimension('proxy_http_indicators') &&
    (coverageCounts.dns_patterns ?? 0) === 0 &&
    (coverageCounts.tls_metadata ?? 0) === 0 &&
    (coverageCounts.proxy_http_indicators ?? 0) === 0
  ) {
    gapPrompts.push('Cite at least one specific network characteristic (DNS behavior, TLS metadata, or proxy/HTTP indicators) and explain why it materially supports your conclusion.');
  }

  const firstDecision = decisionLog[0];
  const lastDecision = decisionLog[decisionLog.length - 1];
  const tailoredPrompts = [
    `Using your selected hypothesis (${finalSelections.primaryHypothesis}), explain how your "${firstDecision?.selectedOption ?? 'initial decision'}" choice shaped the scope of your analysis.`,
    `State how your selected hypothesis (${finalSelections.primaryHypothesis}) aligns with your reported ${finalSelections.riskLevel.toLowerCase()} risk level, and reference one decision from your trace as supporting rationale.`,
    `Based on your final confidence level (${finalSelections.confidenceLevel}), identify one additional check you would run to validate or challenge your "${lastDecision?.selectedOption ?? 'final decision'}" choice.`,
  ];

  return {
    decisionTraceSummary: {
      decisions: decisionLog.map((entry, index) => ({
        order: index + 1,
        decisionId: entry.decisionId,
        prompt: entry.prompt,
        selectedOption: entry.selectedOption,
      })),
      finalSelections,
    },
    coverageByDimension,
    implications: implications.slice(0, 6),
    reportChecklist: {
      coreSections: rules.reportSections,
      missingDimensions,
      gapPrompts,
      tailoredPrompts,
    },
  };
}

export function formatDimensionLabel(dimension: string): string {
  return titleCase(dimension.replace(/_/g, ' '));
}
