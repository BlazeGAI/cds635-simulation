import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

const schema = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'SESSION_SCHEMA.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const argPath = process.argv[2];
const jsonInput = argPath ? fs.readFileSync(path.resolve(argPath), 'utf8') : fs.readFileSync(0, 'utf8');
const data = JSON.parse(jsonInput);

const ok = validate(data);
if (!ok) {
  console.error('❌ Session JSON is invalid:');
  for (const err of validate.errors ?? []) {
    console.error(`  - ${err.instancePath || '/'} ${err.message}`);
  }
  process.exit(1);
}

console.log('✅ Session JSON is valid');
