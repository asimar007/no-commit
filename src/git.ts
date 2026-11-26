import { execa } from "execa";
import { KnownError } from "./error.js";

// Left out of the AI diff to save tokens; still listed and committed normally.
// "top" makes each pattern match from the repo root, even when run from a subfolder.
const EXCLUDE = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "node_modules/**",
  "dist/**",
  "build/**",
  ".next/**",
  "*.min.js",
  "*.map",
  "*.log",
].map((file) => ":(top,exclude)" + file);

const MAX_FILES = 5;
const PER_FILE_MAX_LINES = 30;
const TOTAL_MAX_CHARS = 4000;

// Check git init or not
const isGitRepo = async (): Promise<boolean> => {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
};

export const assertGitRepo = async (): Promise<void> => {
  if (!(await isGitRepo())) {
    throw new KnownError(
      "Not a git repository. Run this command inside 'git init'",
    );
  }
};

// Stages changes to tracked files (git add --update)
export const stageAllChanges = async (): Promise<void> => {
  await execa("git", ["add", "--update"]);
};

// Staged file names, relative to the repo root
const listStagedFiles = async (...pathspecs: string[]): Promise<string[]> => {
  const { stdout } = await execa("git", [
    "diff",
    "--staged",
    "--name-only",
    "--",
    ":/",
    ...pathspecs,
  ]);
  return stdout.split("\n").filter(Boolean);
};

export const getStagedFiles = (): Promise<string[]> => listStagedFiles();

// git commit -m "your message here"
export const commitChanges = async (message: string): Promise<void> => {
  await execa("git", ["commit", "-m", message], {
    stdio: "inherit",
  });
};

/**
 * Extracts only changed lines from the staged diff for token efficiency.
 * Skips EXCLUDE files. Limits: 5 files, 30 lines per file, 4000 chars total.
 */
export const buildDiffSnippets = async (): Promise<string> => {
  const targetFiles = (await listStagedFiles(...EXCLUDE)).slice(0, MAX_FILES);
  const parts: string[] = [];
  let remaining = TOTAL_MAX_CHARS;

  for (const file of targetFiles) {
    const { stdout } = await execa("git", [
      "diff",
      "--cached",
      "--unified=0",
      "--",
      ":(top,literal)" + file,
    ]);

    if (!stdout) continue;

    const lines = stdout.split("\n").filter(Boolean);
    const picked: string[] = [];

    for (const line of lines) {
      const isHunk = line.startsWith("@@");
      const isChange =
        (line.startsWith("+") || line.startsWith("-")) &&
        !line.startsWith("+++") &&
        !line.startsWith("---");

      if (isHunk || isChange) {
        picked.push(line);
        if (picked.length >= PER_FILE_MAX_LINES) break;
      }
    }

    if (picked.length > 0) {
      const block = [`# ${file}`, ...picked].join("\n");
      parts.push(block.slice(0, remaining));
      remaining -= Math.min(block.length, remaining);
    }

    if (remaining <= 0) break;
  }

  return parts.join("\n\n");
};
