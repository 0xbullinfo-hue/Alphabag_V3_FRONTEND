#!/usr/bin/env node

/**
 * OpenAPI TypeScript Generator
 * 
 * Generates TypeScript interfaces from OpenAPI 3.0.0 component schemas.
 * Allows frontend and backend-UI to import types directly from the API contract.
 * 
 * Usage:
 *   node scripts/generate-types-from-openapi.js
 * 
 * Output:
 *   src/types/openapi-contracts.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.dirname(__dirname);
const BACKEND_ROOT = path.join(ROOT, '..', 'Alphabag_V3_Backend');

const SPEC_PATH = path.join(BACKEND_ROOT, 'openapi.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'types', 'openapi-contracts.ts');

console.log('\n📝 Generating TypeScript types from OpenAPI spec...\n');

// Load spec
let spec;
try {
    const content = fs.readFileSync(SPEC_PATH, 'utf-8');
    spec = yaml.load(content);
    console.log(`✓ Loaded OpenAPI spec from ${SPEC_PATH}`);
} catch (err) {
    console.error(`✗ Failed to load spec: ${err.message}`);
    process.exit(1);
}

// Convert OpenAPI schema to TypeScript interface
const schemaToTypescript = (name, schema, depth = 0) => {
    const indent = '  '.repeat(depth);
    const contentIndent = '  '.repeat(depth + 1);

    if (!schema || typeof schema !== 'object') {
        return `${indent}export type ${name} = unknown;`;
    }

    // Handle simple types
    if (schema.type === 'string') {
        const enums = schema.enum;
        if (enums) {
            return `${indent}export type ${name} = ${enums.map(e => `'${e}'`).join(' | ')};`;
        }
        return `${indent}export type ${name} = string;`;
    }
    if (schema.type === 'number') return `${indent}export type ${name} = number;`;
    if (schema.type === 'integer') return `${indent}export type ${name} = number;`;
    if (schema.type === 'boolean') return `${indent}export type ${name} = boolean;`;

    // Handle arrays
    if (schema.type === 'array') {
        if (schema.items?.$ref) {
            const refType = schema.items.$ref.split('/').pop();
            return `${indent}export type ${name} = ${refType}[];`;
        }
        if (schema.items?.type === 'string') {
            return `${indent}export type ${name} = string[];`;
        }
        return `${indent}export type ${name} = any[];`;
    }

    // Handle object types
    if (schema.type === 'object' || schema.properties) {
        let lines = [`${indent}export interface ${name} {`];
        
        const props = schema.properties || {};
        const required = new Set(schema.required || []);

        Object.entries(props).forEach(([key, propSchema]) => {
            const optional = !required.has(key) ? '?' : '';
            let propType = 'unknown';

            if (propSchema.$ref) {
                propType = propSchema.$ref.split('/').pop();
            } else if (propSchema.type === 'string') {
                if (propSchema.enum) {
                    propType = propSchema.enum.map(e => `'${e}'`).join(' | ');
                } else if (propSchema.format === 'date-time') {
                    propType = 'string'; // ISO 8601 datetime
                } else {
                    propType = 'string';
                }
            } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
                propType = 'number';
            } else if (propSchema.type === 'boolean') {
                propType = 'boolean';
            } else if (propSchema.type === 'array') {
                if (propSchema.items?.$ref) {
                    propType = propSchema.items.$ref.split('/').pop() + '[]';
                } else if (propSchema.items?.type === 'string') {
                    propType = 'string[]';
                } else {
                    propType = 'any[]';
                }
            } else if (propSchema.type === 'object') {
                propType = 'Record<string, any>';
            }

            // Handle nullable
            if (propSchema.nullable) {
                propType += ' | null';
            }

            lines.push(`${contentIndent}${key}${optional}: ${propType};`);
        });

        lines.push(`${indent}}`);
        return lines.join('\n');
    }

    // Handle references
    if (schema.$ref) {
        const refType = schema.$ref.split('/').pop();
        return `${indent}export type ${name} = ${refType};`;
    }

    // Fallback
    return `${indent}export type ${name} = any;`;
};

// Generate TypeScript file
const schemas = spec.components.schemas || {};
const typeDefinitions = [];

// Add header comment
typeDefinitions.push(
    '/**',
    ' * OpenAPI Contract Types',
    ' *',
    ' * Auto-generated from openapi.yaml',
    ' * Do not edit manually. Regenerate with: node scripts/generate-types-from-openapi.js',
    ' *',
    ' * Import usage:',
    ' *   import { AirdropStatusResponse, Mission } from "./openapi-contracts";',
    ' */',
    ''
);

// Sort schemas by dependency (referenced schemas first)
const sortedSchemas = Object.entries(schemas).sort(([nameA], [nameB]) => {
    const aIsRef = Object.values(schemas[nameA] || {}).some(v => 
        v && typeof v === 'object' && v.$ref
    );
    const bIsRef = Object.values(schemas[nameB] || {}).some(v => 
        v && typeof v === 'object' && v.$ref
    );
    return bIsRef - aIsRef; // Schemas with refs come last
});

sortedSchemas.forEach(([name, schema]) => {
    typeDefinitions.push(schemaToTypescript(name, schema));
    typeDefinitions.push('');
});

// Add index export for convenience
typeDefinitions.push('// Export all types as a namespace');
typeDefinitions.push('export namespace OpenAPI {');
Object.keys(schemas).forEach(name => {
    typeDefinitions.push(`  export type ${name} = import('./openapi-contracts').${name};`);
});
typeDefinitions.push('}');
typeDefinitions.push('');

const output = typeDefinitions.join('\n');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write file
try {
    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
    console.log(`✓ Generated ${Object.keys(schemas).length} type definitions`);
    console.log(`✓ Output: ${OUTPUT_PATH}`);
    console.log(`\nFile size: ${(output.length / 1024).toFixed(2)} KB\n`);
} catch (err) {
    console.error(`✗ Failed to write output: ${err.message}`);
    process.exit(1);
}

console.log('✅ Type generation complete!\n');
