import * as nunjucks from 'nunjucks';
import * as path from 'path';
import * as fs from 'fs';

let env: nunjucks.Environment | null = null;

export function initTemplateEngine(basePath: string): void {
  env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(basePath, {
      noCache: true,
      watch: false,
    }),
    {
      autoescape: false,
      throwOnUndefined: false,
    }
  );

  // Add custom filters
  env.addFilter('b64encode', (str: string) => Buffer.from(str).toString('base64'));
  env.addFilter('b64decode', (str: string) => Buffer.from(str, 'base64').toString());
  env.addFilter('url_encode', (str: string) => encodeURIComponent(str));
  env.addFilter('url_decode', (str: string) => decodeURIComponent(str));
}

export function renderTemplate(templatePath: string, context: Record<string, unknown>): string {
  if (!env) {
    throw new Error('Template engine not initialized. Call initTemplateEngine() first.');
  }

  // Check if template file exists
  const fullPath = templatePath;
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template not found: ${fullPath}`);
  }

  return env.render(fullPath, context);
}

export function renderString(template: string, context: Record<string, unknown>): string {
  if (!env) {
    throw new Error('Template engine not initialized. Call initTemplateEngine() first.');
  }

  return env.renderString(template, context);
}
