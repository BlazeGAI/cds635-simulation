import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

export type Scenario = {
  scenarioId: string;
  title: string;
  briefing: { narrative: string; instructions: string };
  evidence_items: Array<{ id: string; type: 'report' | 'indicator' | 'timeline' | 'statement'; content: string }>;
  decision_nodes: Array<{
    id: string;
    prompt: string;
    recordInFinalScreen: boolean;
    options: Array<{ label: string; nextNodeId: string | null }>;
  }>;
  required_final_selections: {
    primaryHypothesis: { mode: 'options'; options: string[] } | { mode: 'freeText'; minLength: number };
    riskLevel: { mode: 'enum'; allowed: Array<'Low' | 'Medium' | 'High' | 'Critical'> };
    confidenceLevel: { mode: 'enum'; allowed: Array<'Low' | 'Medium' | 'High'> };
  };
  downloadable_artifacts: Array<{ format: 'JSON' | 'PDF' | 'TXT' }>;
};

let compiled: ValidateFunction | null = null;

async function getValidator(): Promise<ValidateFunction> {
  if (compiled) return compiled;

  const rawSchema = await fs.readFile(path.join(process.cwd(), 'SCENARIO_SCHEMA.json'), 'utf8');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  compiled = ajv.compile(JSON.parse(rawSchema));
  return compiled;
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) return 'Unknown schema validation error';
  return errors.map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim()).join('; ');
}

export async function loadScenario(weekId: number | string): Promise<Scenario> {
  const scenarioPath = path.join(process.cwd(), 'scenarios', `week${weekId}.json`);
  const raw = await fs.readFile(scenarioPath, 'utf8');
  const data = JSON.parse(raw);
  const validate = await getValidator();

  if (!validate(data)) {
    throw new Error(`Invalid scenario configuration at ${scenarioPath}: ${formatAjvErrors(validate.errors)}`);
  }

  return data as Scenario;
}
