import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const DOC_OUTPUT_DIR = path.join(PACKAGE_ROOT, 'docs', 'api_reference');
const LOAD_SNIPPET =
  ';(()=>{try{const e=document.createElement("script");e.src="assets/bandit-docs.js";e.defer=!0;document.head.appendChild(e)}catch(e){}})();';

const STYLE_OVERRIDE_START = '/* Bandit overrides start */';
const STYLE_OVERRIDE_END = '/* Bandit overrides end */';
const STYLE_OVERRIDE_FULL = `
${STYLE_OVERRIDE_START}
:root {
  --bandit-primary: #1976d2;
  --bandit-primary-strong: #0d47a1;
  --bandit-primary-soft: #90caf9;
  --bandit-surface: #ffffff;
  --bandit-surface-alt: #f4f7fb;
  --bandit-border: rgba(13, 31, 68, 0.08);
  --bandit-text-strong: #101935;
  --bandit-text-muted: rgba(16, 25, 53, 0.64);
  --bandit-radius-lg: 18px;
  --bandit-shadow-lg: 0 22px 48px rgba(13, 31, 68, 0.12);
}

@media (prefers-color-scheme: light) {
  :root {
    --color-background: var(--bandit-surface-alt);
    --color-background-secondary: var(--bandit-surface);
    --color-active-menu-item: rgba(25, 118, 210, 0.08);
    --color-accent: rgba(25, 118, 210, 0.12);
    --color-link: var(--bandit-primary);
    --color-focus-outline: var(--bandit-primary);
    --color-text: var(--bandit-text-strong);
    --color-text-aside: var(--bandit-text-muted);
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bandit-primary-strong: #90caf9;
    --color-background: #050b19;
    --color-background-secondary: #0f172a;
    --color-active-menu-item: rgba(144, 202, 249, 0.16);
    --color-accent: rgba(144, 202, 249, 0.12);
    --color-link: #90caf9;
    --color-focus-outline: #90caf9;
    --color-text: #e6f2ff;
    --color-text-aside: rgba(230, 242, 255, 0.68);
  }
}

body {
  font-family: "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif;
  background: var(--color-background);
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.tsd-page-toolbar,
.tsd-navigation,
.tsd-navigation table,
.tsd-panel,
.tsd-filter-visibility,
.tsd-index-panel,
.tsd-signature,
.tsd-accordion-details,
.tsd-hierarchy {
  background: var(--color-background-secondary);
  border-radius: var(--bandit-radius-lg);
  border: 1px solid var(--bandit-border);
  box-shadow: var(--bandit-shadow-lg);
}

.tsd-page-toolbar {
  padding: 1rem 1.5rem;
}

.tsd-navigation .tsd-navigation__title {
  font-weight: 700;
  color: var(--color-text);
}

.tsd-navigation a {
  border-radius: 0.75rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}

.tsd-navigation a:hover,
.tsd-navigation a.current,
.tsd-navigation a.tsd-kind-icon:focus {
  background: var(--color-active-menu-item);
  color: var(--color-link);
}

.tsd-breadcrumb {
  font-weight: 600;
  color: var(--color-text-aside);
}

.tsd-typography h1,
.tsd-typography h2,
.tsd-typography h3,
.tsd-typography h4,
.tsd-comment h1,
.tsd-comment h2,
.tsd-comment h3 {
  font-weight: 700;
  color: var(--color-text);
}

.tsd-typography p,
.tsd-comment p,
.tsd-comment li {
  color: var(--color-text-aside);
  font-size: 1rem;
}

a {
  color: var(--color-link);
  font-weight: 600;
  text-decoration: none;
}

a:hover {
  color: var(--bandit-primary-strong);
  text-decoration: underline;
}

.tsd-typography img[alt="Burtson Labs Logo"] {
  max-width: 120px;
  width: 120px;
}

code,
pre {
  border-radius: 12px;
  font-family: "JetBrains Mono", "Fira Code", "Source Code Pro", monospace;
}

.tsd-generator,
.tsd-page-toolbar .tsd-toolbar-contents {
  color: var(--color-text-aside);
}

.tsd-accordion-summary {
  font-weight: 600;
}

.tsd-breadcrumb a {
  color: var(--color-link);
}

.tsd-breadcrumb a:hover {
  color: var(--bandit-primary-strong);
}

.tsd-comment .tsd-tag,
.tsd-flag {
  border-radius: 999px;
  background: var(--color-active-menu-item);
  border: none;
  color: var(--color-link);
  font-weight: 600;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(25, 118, 210, 0.32);
  border-radius: 999px;
}

::-webkit-scrollbar-track {
  background: rgba(25, 118, 210, 0.08);
}
${STYLE_OVERRIDE_END}
`.trim();

const findRepoRoot = (startDir) => {
  let current = startDir;

  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }

    const next = path.dirname(current);
    if (next === current) {
      return null;
    }
    current = next;
  }
};

const resolveExistingPath = async (paths) => {
  for (const candidate of paths) {
    if (!candidate) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await fsExtra.pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
};

const ensureStyleOverrides = async (targetDir) => {
  const stylePath = path.join(targetDir, 'assets', 'style.css');
  const exists = await fsExtra.pathExists(stylePath);
  if (!exists) {
    return;
  }

  let css = await fsExtra.readFile(stylePath, 'utf8');
  const startIndex = css.indexOf(STYLE_OVERRIDE_START);
  const endIndex = css.indexOf(STYLE_OVERRIDE_END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    css = css.slice(0, startIndex).trimEnd() + '\n';
  }

  const mergedCss = `${css.trimEnd()}\n\n${STYLE_OVERRIDE_FULL}\n`;
  await fsExtra.writeFile(stylePath, mergedCss, 'utf8');
};

const ensureCustomScript = async (targetDir, scriptSource) => {
  if (!scriptSource) {
    console.warn('⚠️  No Bandit docs enhancer script source found; skipping injection.');
    return;
  }

  const assetsDir = path.join(targetDir, 'assets');
  const exists = await fsExtra.pathExists(assetsDir);
  if (!exists) {
    return;
  }

  const destination = path.join(assetsDir, 'bandit-docs.js');
  await fsExtra.copy(scriptSource, destination, { overwrite: true });

  const mainScriptPath = path.join(assetsDir, 'main.js');
  const mainExists = await fsExtra.pathExists(mainScriptPath);
  if (!mainExists) {
    return;
  }

  let mainSource = await fsExtra.readFile(mainScriptPath, 'utf8');
  if (!mainSource.includes('assets/bandit-docs.js')) {
    mainSource = `${mainSource.trim()}\n${LOAD_SNIPPET}\n`;
    await fsExtra.writeFile(mainScriptPath, mainSource, 'utf8');
  }
};

export const syncTypedocAssets = async () => {
  const docsExist = await fsExtra.pathExists(DOC_OUTPUT_DIR);
  if (!docsExist) {
    console.warn(`⚠️  TypeDoc output directory missing at ${DOC_OUTPUT_DIR}; skipping sync.`);
    return;
  }

  const repoRoot = findRepoRoot(PACKAGE_ROOT);

  const customScriptSource = await resolveExistingPath([
    path.join(PACKAGE_ROOT, 'typedoc', 'bandit-docs.js'),
    repoRoot ? path.join(repoRoot, 'typedoc', 'bandit-docs.js') : null,
  ]);

  await ensureCustomScript(DOC_OUTPUT_DIR, customScriptSource);
  await ensureStyleOverrides(DOC_OUTPUT_DIR);

  if (!repoRoot) {
    return;
  }

  const publicDir = path.join(repoRoot, 'public');
  if (!(await fsExtra.pathExists(publicDir))) {
    return;
  }

  const publicDocsDir = path.join(publicDir, 'docs', 'api_reference');
  await fsExtra.remove(publicDocsDir);
  await fsExtra.copy(DOC_OUTPUT_DIR, publicDocsDir, { overwrite: true });
  await ensureCustomScript(publicDocsDir, customScriptSource);
  await ensureStyleOverrides(publicDocsDir);
};

const runDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (runDirectly) {
  syncTypedocAssets().catch((error) => {
    console.error('Failed to apply Bandit docs enhancements after TypeDoc generation.');
    console.error(error);
    process.exit(1);
  });
}
