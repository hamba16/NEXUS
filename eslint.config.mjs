import tseslint from 'typescript-eslint';
export default [
  { ignores: ['**/node_modules/**','**/.next/**','.tools/**','.venv/**','packages/contracts/schema.d.ts'] },
  ...tseslint.configs.recommended.map(config => ({ ...config, files: ['apps/web/**/*.ts','apps/web/**/*.tsx','packages/**/*.ts'] })),
];
