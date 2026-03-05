import week1FeedbackRules from '@/feedback/week1_feedback.json';
import week2FeedbackRules from '@/feedback/week2_feedback.json';
import week3FeedbackRules from '@/feedback/week3_feedback.json';

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
};

function getWeekKeyFromScenarioId(scenarioId: string): string {
  const match = scenarioId.match(/week(\d+)/i);
  return match?.[1] ?? '1';
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

  if (supportsDimension('next_move') && supportsDimension('mitigation') && (coverageCounts.next_move ?? 0) > 0 && (coverageCounts.mitigation ?? 0) === 0) {
    implications.push('You projected the likely next move without committing to a mitigation path; align your forecast with a concrete defensive priority and ownership.');
  }

  if (implications.length < 4) {
    implications.push('Your report should connect each major choice to expected operational impact so decision-makers can see why the selected path is practical now.');
    implications.push('Frame your conclusions as a current working assessment and identify what new evidence would most likely strengthen or revise that assessment.');
  }

  const gapPrompts = rules.gapRules
    .filter((rule) => (coverageCounts[rule.dimension] ?? 0) < rule.minCount)
    .map((rule) => rule.prompt);

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
