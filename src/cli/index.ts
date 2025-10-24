/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-4003-ED009B
const __banditFingerprint_cli_indexts = 'BL-FP-EBD653-077C';
const __auditTrail_cli_indexts = 'BL-AU-MGOIKVV7-9HPQ';
// File: index.ts | Path: src/cli/index.ts | Hash: 4003077c

/* eslint-disable no-console */
import path from "node:path";
import { Command } from "commander";
import packageJson from "../../package.json";
import { createQuickstartProject } from "./createQuickstart";

const logIntro = () => {
  console.log("🥷 Bandit CLI — Burtson Labs 🧪");
};

const program = new Command();

program
  .name("bandit")
  .description("Bandit Engine developer utilities")
  .version(packageJson.version)
  .showHelpAfterError();

program
  .command("create")
  .description("Scaffold a Bandit quickstart project with a frontend and gateway")
  .argument("[directory]", "Relative path for your new project", "bandit-quickstart")
  .option("-f, --force", "Overwrite the target directory if it already contains files", false)
  .option("--branding-text <text>", "Assistant display name shown in the UI")
  .option(
    "--provider <provider>",
    "Default gateway provider (openai, azure, anthropic, ollama)"
  )
  .option("--frontend-port <port>", "Frontend dev server port (default: 5183)", (value) =>
    parseInt(value, 10)
  )
  .option("--gateway-port <port>", "Gateway port (default: 8080)", (value) => parseInt(value, 10))
  .option("-y, --yes", "Skip interactive prompts and accept defaults", false)
  .option("--skip-prompts", "Alias for --yes", false)
  .action(async (directory: string, cmdOptions: Record<string, unknown>) => {
    try {
      const targetDir = directory ?? "bandit-quickstart";
      const projectName = path.basename(path.resolve(process.cwd(), targetDir));
      logIntro();
      const skipPrompts = Boolean(cmdOptions.skipPrompts ?? cmdOptions.yes);
      const result = await createQuickstartProject({
        targetDir,
        projectName,
        force: Boolean(cmdOptions.force),
        brandingText: cmdOptions.brandingText as string | undefined,
        provider: typeof cmdOptions.provider === "string" ? (cmdOptions.provider as string) : undefined,
        frontendPort: Number.isFinite(cmdOptions.frontendPort as number)
          ? (cmdOptions.frontendPort as number)
          : undefined,
        gatewayPort: Number.isFinite(cmdOptions.gatewayPort as number)
          ? (cmdOptions.gatewayPort as number)
          : undefined,
        skipPrompts,
      });

      const relativeDir = path.relative(process.cwd(), result.projectDir) || ".";
      console.log("\n✅ Quickstart ready!");
      console.log(`   Location: ${result.projectDir}`);
      console.log(`   Package:  ${result.packageName}`);
      console.log(`   App name: ${result.brandingText}`);
      console.log(`   Frontend: http://localhost:${result.frontendPort}`);
      console.log(`   Gateway:  http://localhost:${result.gatewayPort}`);

      console.log("\nNext steps:");
      console.log(`  cd ${relativeDir}`);
      console.log("  npm install");
      console.log("  cp .env.example .env");
      console.log("  npm run dev");
      console.log("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create Bandit quickstart project.";
      console.error(`\n❌ ${message}`);
      process.exitCode = 1;
    }
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
