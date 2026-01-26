#!/usr/bin/env node
import { Command } from "commander";
import { intro, outro, spinner, select, text, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { setConfig, getConfig, ConfigSchema } from "./config.js";
import {
  assertGitRepo,
  hasStagedChanges,
  stageAllChanges,
  commitChanges,
  getStagedFiles,
  buildDiffSnippets,
} from "./git.js";
import { generateCommitMessages } from "./ai.js";
import { KnownError, handleCliError } from "./error.js";

const program = new Command();
program
  .name("autocommit")
  .version("0.0.0")
  .description("AI-powered git commit message generator")
  .option("-a, --all", "Stage all tracked changes before committing")
  .option("-y, --yes", "Skip confirmation and commit with first suggestion");

// Main command execution logic for generating and committing messages
program.action(async (options) => {
  intro(pc.bgCyan(pc.black(" autocommit ")));

  try {
    await assertGitRepo();

    if (options.all) {
      await stageAllChanges();
    }

    if (!(await hasStagedChanges())) {
      throw new KnownError(
        'No staged changes found. Stage files with "git add ." or use --all flag.',
      );
    }

    const s = spinner();
    s.start("Detecting staged files...");

    const files = await getStagedFiles();

    s.stop(`Found ${files.length} staged file(s):`);
    console.log(pc.dim(files.map((f) => `  ${f}`).join("\n")));

    s.start("Analyzing changes with AI...");

    const diffSnippets = await buildDiffSnippets(files);

    const messages = await generateCommitMessages({
      diffSnippets,
      files,
    });

    s.stop("Generated commit message");

    if (options.yes) {
      const message = messages[0];
      console.log(pc.dim(`Using: ${message}`));
      await commitChanges(message);
      outro(pc.green("✔ Committed!"));
      return;
    }

    let selectedMessage = messages[0];

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
        const newMessages = await generateCommitMessages({
          diffSnippets,
          files,
        });
        s.stop("New message generated");
        selectedMessage = newMessages[0];
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
  "timeout",
  "generate",
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
    } else if (key === "timeout") {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 5000 || num > 120000) {
        console.log(
          pc.red("timeout must be a number between 5000 and 120000 (ms)"),
        );
        process.exit(1);
      }
      setConfig("timeout", num);
    } else if (key === "generate") {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 5) {
        console.log(pc.red("generate must be a number between 1 and 5"));
        process.exit(1);
      }
      setConfig("generate", num);
    } else {
      setConfig(key as "GEMINI_API_KEY" | "model", val);
    }

    console.log(pc.green(`✔ Set ${key}`));
  });

configCmd
  .command("get [key]")
  .description("Get config value(s)")
  .action((key) => {
    if (key) {
      if (!VALID_CONFIG_KEYS.includes(key as ValidConfigKey)) {
        console.log(pc.red(`Invalid key: ${key}`));
        console.log(pc.yellow(`Valid keys: ${VALID_CONFIG_KEYS.join(", ")}`));
        process.exit(1);
      }
      const val = getConfig(key as keyof ConfigSchema);
      // Mask API key for security
      if (
        key === "GEMINI_API_KEY" &&
        typeof val === "string" &&
        val.length > 8
      ) {
        console.log(`${key}: ${val.slice(0, 4)}...${val.slice(-4)}`);
      } else {
        console.log(`${key}: ${val}`);
      }
    } else {
      console.log(pc.bold("Current configuration:"));
      for (const k of VALID_CONFIG_KEYS) {
        const val = getConfig(k as keyof ConfigSchema);
        if (
          k === "GEMINI_API_KEY" &&
          typeof val === "string" &&
          val.length > 8
        ) {
          console.log(`  ${k}: ${val.slice(0, 4)}...${val.slice(-4)}`);
        } else {
          console.log(`  ${k}: ${val}`);
        }
      }
    }
  });

program.parse();
