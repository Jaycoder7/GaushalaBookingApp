import fs from 'fs';
import path from 'path';

const [, , description] = process.argv;

if (!description) {
  console.error('Usage: npm run migration:create -- migration_description');
  process.exit(1);
}

const timestamp = Date.now();
const filename = `${timestamp}_${description.replace(/\s+/g, '_')}.sql`;
const filePath = path.join(__dirname, filename);

const template = `-- Migration: ${description}
-- Created: ${new Date().toISOString()}

-- Add your SQL here
`;

fs.writeFileSync(filePath, template);
console.log(`Created migration: ${filename}`);
