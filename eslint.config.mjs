import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from 'eslint-plugin-unused-imports';


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"], plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'arrow-body-style': ["warn", "as-needed"],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-useless-catch': 'off',
      'no-constant-condition': 'off',
      'no-empty': 'off',
      'no-empty-pattern': 'off',
      'no-unsafe-finally': 'off',
      'no-async-promise-executor': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'eqeqeq': "warn",
      'no-useless-computed-key': 'warn',
      'prefer-const':"warn",
      "@typescript-eslint/no-unsafe-function-type":"warn",
      "@typescript-eslint/no-empty-object-type":"warn",
      "no-prototype-builtins":"warn",
    },
  },
];