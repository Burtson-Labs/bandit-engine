# Contributing Guide
## Overview
We welcome community pull requests that improve the Bandit Engine while respecting the Business Source License. This document summarizes expectations for contributors and the workflow we follow internally.

## Endpoints / API Usage
Contributors rarely need to modify gateway endpoints, but when you do:
- Update relevant docs in [`docs/02_gateway_api.md`](./02_gateway_api.md).
- Add integration tests that hit mock endpoints exposed by the example gateway.
- Ensure new endpoints remain optional for existing deployments.

## Example Implementation
1. **Clone and install**:
   ```bash
   git clone https://github.com/Burtson-Labs/bandit.git
   cd bandit
   npm install
   ```
2. **Run tests and linting**:
   ```bash
   npm run test --workspace @burtson-labs/bandit-engine
   npm run build --workspace @burtson-labs/bandit-engine
   ```
3. **Document your change** by updating the numbered docs in `/docs` and running `npm run docs` to regenerate the TypeDoc API reference.

## Integration Notes
- Follow the protection workflow before opening a PR: run `npm run protect` then `npm run validate-protection`.
- Use feature flags when shipping enterprise-only functionality.
- Keep `dist/` generated; do not commit builds. The release action handles publishing.

## Related Files
- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`LICENSE-NOTICE.md`](../LICENSE-NOTICE.md)
- [`docs/06_busl_licensing.md`](./06_busl_licensing.md)
