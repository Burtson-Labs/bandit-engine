# Contributing to Bandit Engine

We appreciate improvements from the community. Before submitting a pull request, please review the guidelines below.

## Publication workflow

The public `bandit-engine` package is synchronized from an internal strategy repository. Community pull requests are reviewed in this mirror, but they are not merged directly on GitHub. Maintainers will:

1. Review your proposal and request updates if needed.
2. Merge approved changes upstream with the full commit history intact.
3. Push the synchronized branch back to this repository and close the public PR with a note referencing the upstream merge.

This approach keeps our release history consistent while still giving you credit for the work. Expect commit messages in the public history to include the originating issue number and branch name (for example, `1234-fix-streaming: adjust memory store`).

## Getting started

1. Fork the repository and create a topic branch from `main` (for example `feature/add-new-adapter`, `defect/fix-stuck-stream`, or `docs/update-readme`).
2. Install dependencies with `npm install` at the repo root.
3. Focus your changes within this package so reviews stay scoped and easy to sync upstream.
4. Open an issue first for large or controversial changes so we can align on scope.

## Development workflow

- **Lint & test**: Run `npm run test --workspace @burtson-labs/bandit-engine` before opening a PR.
- **Build**: Confirm `npm run build --workspace @burtson-labs/bandit-engine` succeeds.
- **Docs**: Update the numbered docs in `/docs` and run `npm run docs --workspace @burtson-labs/bandit-engine` when API surfaces change.
- **Protection scripts**: Execute `npm run protect` and `npm run validate-protection` to keep BUSL headers intact.
- **Commit messages**: Use descriptive messages that start with the issue number and your branch name (e.g. `1450-feature/add-new-adapter: clarify prompts`).

## Pull request checklist

- Provide a clear description of the change and the motivation.
- Reference related issues or discussions and explain any trade-offs.
- Include screenshots or recordings when touching UI elements.
- Add or update tests when possible, or explain why they are not required.
- Note any follow-up work that should land in the upstream strategy repository.

## Code style & best practices

- Use TypeScript for new modules and prefer composition over inheritance; hooks are the primary abstraction for shared logic.
- Follow existing naming conventions (`camelCase` for functions, `PascalCase` for components) while calling out areas that would benefit from cleanup.
- Keep dependencies minimal—discuss major additions in an issue first.
- We are actively tidying the codebase. If you spot inconsistencies or have ideas for better conventions, please suggest them in your PR notes; we welcome improvements that make the project easier to maintain.

By contributing you agree that your submissions will be licensed under the Business Source License 1.1.
