#!/usr/bin/env node
import { Command } from "commander";
import { outro, spinner, select, text, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { setConfig, getConfig } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);
import {
  assertGitRepo,
  stageAllChanges,
  commitChanges,
  getStagedFiles,
  buildDiffSnippets,
} from "./git.js";
import { generateCommitMessage } from "./ai.js";
import { KnownError, handleCliError } from "./error.js";

const logo = `▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▌
▐███╗   ██╗ ██████╗      ██████╗ ██████╗ ███╗   ███╗███╗   ███╗██╗████████╗▌
▐████╗  ██║██╔═══██╗    ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██║╚══██╔══╝▌
▐██╔██╗ ██║██║   ██║    ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║   ▌
▐██║╚██╗██║██║   ██║    ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║   ▌
▐██║ ╚████║╚██████╔╝    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║   ██║   ▌
▐╚═╝  ╚═══╝ ╚═════╝      ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ▌
▐▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▌`;

const program = new Command();
program
  .name("nocommit")
  .version(version)
  .description("AI-powered git commit message generator")
  .option("-a, --all", "Stage all tracked changes before committing")
  .option("-y, --yes", "Skip confirmation and commit with first suggestion");

// Main command execution logic for generating and committing messages
program.action(async (options) => {
  console.log(pc.yellow(logo));

  try {
    await assertGitRepo();

    if (options.all) {
      await stageAllChanges();
    }

    const files = await getStagedFiles();

    if (files.length === 0) {
      throw new KnownError(
        'No staged changes found. Stage files with "git add ." or use --all flag.'
      );
    }

    const s = spinner();
    s.start("Detecting staged files...");
    s.stop(`Found ${files.length} staged file(s):`);
    console.log(pc.dim(files.map((f) => `  ${f}`).join("\n")));

    s.start("Analyzing changes with AI...");

    const diffSnippets = await buildDiffSnippets();

    const message = await generateCommitMessage(diffSnippets, files);

    s.stop("Generated commit message");

    if (options.yes) {
      console.log(pc.dim(`Using: ${message}`));
      await commitChanges(message);
      outro(pc.green("✔ Committed!"));
      return;
    }

    let selectedMessage = message;

    while (true) {
      const action = await select({
        message: `${pc.green(selectedMessage)}`,
        options: [
          { value: "commit", label: "✔ Commit" },
          { value: "edit", label: "✎ Edit" },
          { value: "retry", label: "↻ Regenerate" },
          { value: "cancel", label: "✖ Cancel" },
        ],
      });

      if (isCancel(action) || action === "cancel") {
        outro("Cancelled");
        process.exit(0);
      }

      if (action === "commit") {
        await commitChanges(selectedMessage);
        outro(pc.green("✔ Committed!"));
        process.exit(0);
      }

      if (action === "edit") {
        const newMessage = await text({
          message: "Edit message:",
          initialValue: selectedMessage,
          validate: (value) => {
            if (!value || value.trim().length === 0) {
              return "Message cannot be empty";
            }
            return undefined;
          },
        });
        if (!isCancel(newMessage)) {
          selectedMessage = (newMessage as string).trim();
        }
      }

      if (action === "retry") {
        s.start("Regenerating...");
        selectedMessage = await generateCommitMessage(diffSnippets, files);
        s.stop("New message generated");
      }
    }
  } catch (error: any) {
    outro(pc.red(error.message));
    handleCliError(error);
  }
});

// Command to manage application configuration, including API key and model settings
const configCmd = program.command("config").description("Manage configuration");

const VALID_CONFIG_KEYS = [
  "GEMINI_API_KEY",
  "model",
  "maxLength",
] as const;
type ValidConfigKey = (typeof VALID_CONFIG_KEYS)[number];

configCmd
  .command("set <key=value>")
  .description("Set a config value")
  .action((str) => {
    const eqIndex = str.indexOf("=");
    if (eqIndex === -1) {
      console.log(pc.red("Usage: config set KEY=VALUE"));
      process.exit(1);
    }

    const key = str.slice(0, eqIndex);
    const val = str.slice(eqIndex + 1);

    if (!key || !val) {
      console.log(pc.red("Usage: config set KEY=VALUE"));
      process.exit(1);
    }

    if (!VALID_CONFIG_KEYS.includes(key as ValidConfigKey)) {
      console.log(pc.red(`Invalid key: ${key}`));
      console.log(pc.yellow(`Valid keys: ${VALID_CONFIG_KEYS.join(", ")}`));
      process.exit(1);
    }

    if (key === "maxLength") {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 20 || num > 500) {
        console.log(pc.red("maxLength must be a number between 20 and 500"));
        process.exit(1);
      }
      setConfig("maxLength", num);
    } else {
      setConfig(key as "GEMINI_API_KEY" | "model", val);
    }

    console.log(pc.green(`✔ Set ${key}`));
  });

configCmd
  .command("get [key]")
  .description("Get config value(s)")
  .action((key) => {
    if (key && !VALID_CONFIG_KEYS.includes(key as ValidConfigKey)) {
      console.log(pc.red(`Invalid key: ${key}`));
      console.log(pc.yellow(`Valid keys: ${VALID_CONFIG_KEYS.join(", ")}`));
      process.exit(1);
    }

    const keys = key ? [key as ValidConfigKey] : VALID_CONFIG_KEYS;
    if (!key) console.log(pc.bold("Current configuration:"));
    for (const k of keys) {
      const val = getConfig(k);
      // Mask API key for security
      const shown =
        k === "GEMINI_API_KEY" && typeof val === "string" && val.length > 8
          ? `${val.slice(0, 4)}...${val.slice(-4)}`
          : val;
      console.log(`${key ? "" : "  "}${k}: ${shown}`);
    }
  });

program.parse();
