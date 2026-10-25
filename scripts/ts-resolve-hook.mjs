import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error &&
        error.code === 'ERR_MODULE_NOT_FOUND' &&
        specifier.startsWith('.') &&
        specifier.endsWith('.js')
      ) {
        try {
          return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
        } catch (innerError) {
          if (innerError && innerError.code === 'ERR_MODULE_NOT_FOUND') {
            return nextResolve(`${specifier.slice(0, -3)}.tsx`, context);
          }
          throw innerError;
        }
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.tsx')) {
      const filePath = fileURLToPath(url);
      const rawSource = readFileSync(filePath, 'utf8');
      const { code } = esbuild.transformSync(rawSource, {
        loader: 'tsx',
        format: 'esm',
        jsx: 'automatic',
        jsxImportSource: 'preact',
      });
      return {
        format: 'module',
        shortCircuit: true,
        source: code,
      };
    }
    return nextLoad(url, context);
  },
});
