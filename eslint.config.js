import babelParser from '@babel/eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'src/*.bundle.js',
      'service-worker.js',
      'styles/tailwind.css',
      '.test-gates/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
      'dist/**',
      'supabase/**',
    ],
  },
  // Arquivos JavaScript e TypeScript padrão
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
        },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Aviso (não erro): há usos legados; todo valor interpolado deve passar por escapeHtml/escapeAttr.
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "AssignmentExpression[left.property.name='innerHTML'][right.type='TemplateLiteral'][right.expressions.length>0]",
          message:
            'innerHTML com template literal interpolado: escape todo texto do usuário com escapeHtml/escapeAttr.',
        },
      ],
    },
  },
  // Componentes e interfaces com JSX (Preact)
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic', importSource: 'preact' }],
          ],
        },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      react: {
        version: '18.0',
      },
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  // Scripts de terminal / ferramentas CLI
  {
    files: ['scripts/**/*.{js,mjs}'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig,
];
