#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { validate } = require('./simple-schema-validator');

const repoRoot = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'SCENARIO_SCHEMA.json'), 'utf8'));
const scenariosDir = path.join(repoRoot, 'scenarios');

const scenarioFiles = fs.readdirSync(scenariosDir).filter((name) => name.endsWith('.json'));

let hasErrors = false;

for (const file of scenarioFiles) {
  const fullPath = path.join(scenariosDir, file);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    hasErrors = true;
    console.error(`✖ ${file}: invalid JSON (${error.message})`);
    continue;
  }

  const errors = validate(schema, data);
  if (errors.length > 0) {
    hasErrors = true;
    console.error(`✖ ${file}: failed schema validation`);
    for (const err of errors) {
      console.error(`  - ${err.instancePath} ${err.message}`);
    }
  } else {
    console.log(`✔ ${file}`);
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log(`Validated ${scenarioFiles.length} scenario file(s).`);
