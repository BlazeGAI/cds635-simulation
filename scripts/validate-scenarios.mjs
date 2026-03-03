import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaPath = path.join(root, 'SCENARIO_SCHEMA.json');
const scenariosDir = path.join(root, 'scenarios');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json'));
let hasErrors = false;

for (const file of files) {
  const fullPath = path.join(scenariosDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const ok = validate(data);

  if (!ok) {
    hasErrors = true;
    console.error(`❌ ${file} is invalid:`);
    for (const err of validate.errors ?? []) {
      console.error(`  - ${err.instancePath || '/'} ${err.message}`);
    }
  } else {
    console.log(`✅ ${file} is valid`);
  }
}

if (hasErrors) {
  process.exit(1);
}
