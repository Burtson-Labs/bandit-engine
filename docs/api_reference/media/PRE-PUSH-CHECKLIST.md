# Bandit Engine Pre-Push Checklist

Run this sequence before pushing changes or cutting a release tag:

1. `npm run lint` – top-level lint sweep with shared ESLint rules.  
2. `npm run test --workspace @burtson-labs/bandit-engine` – vitest suite.  
3. `npm run build --workspace @burtson-labs/bandit-engine` – tsup build for both module formats.  
4. `npm run docs --workspace @burtson-labs/bandit-engine` – regenerate TypeDoc HTML and commit updated output.  
5. `npm pack --dry-run --workspace @burtson-labs/bandit-engine` – verify the publish payload (no private app assets).  
6. `git status` – ensure only intentional files are staged; add release notes or docs as needed.
