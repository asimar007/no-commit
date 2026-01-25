import { execa } from "execa";
import { KnownError } from "./error.js";

// Exclude from diff to save API Token
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
].flatMap((file) => [":(exclude)" + file]);

// Check git init or not
export const isGitRepo = async (): Promise<boolean> => {
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

// Check Stages everything (git add .)
export const stageAllChanges = async (): Promise<void> => {
  await execa("git", ["add", "--update"]);
};

// gets the actual code changes
export const getStagedDiff = async (): Promise<string> => {
  try {
    const { stdout } = await execa("git", ["diff", "--staged", ...EXCLUDE]);
    return stdout;
  } catch {
    return "";
  }
};

export const hasStagedChanges = async (): Promise<boolean> => {
  const { stdout } = await execa("git", [
    "diff",
    "--staged",
    "--name-only",
    ...EXCLUDE,
  ]);
  return stdout.trim().length > 0;
};

// gets the list of filenames
export const getStagedFiles = async (): Promise<string[]> => {
  const { stdout } = await execa("git", [
    "diff",
    "--staged",
    "--name-only",
    ...EXCLUDE,
  ]);
  return stdout.split("\n").filter(Boolean);
};

// git commit -m "your message here"
export const commitChanges = async (message: string): Promise<void> => {
  await execa("git", ["commit", "-m", message], {
    stdio: "inherit",
  });
};

/**
 * Extracts only changed lines from diff for token efficiency.
 * Limits: 5 files max, 30 lines per file, 4000 chars total.
 */

export const buildDiffSnippets = async (
  files: string[],
  perFileMaxLines: number = 30,
  totalMaxChars: number = 4000,
): Promise<string> => {
  try {
    const targetFiles = files.slice(0, 5);
    const parts: string[] = [];
    let remaining = totalMaxChars;

    for (const file of targetFiles) {
      const { stdout } = await execa("git", [
        "diff",
        "--cached",
        "--unified=0",
        "--",
        file,
      ]);

      if (!stdout) continue;

      const lines = stdout.split("\n").filter(Boolean);
      const picked: string[] = [];
      let count = 0;

      for (const line of lines) {
        const isHunk = line.startsWith("@@");
        const isChange =
          (line.startsWith("+") || line.startsWith("-")) &&
          !line.startsWith("+++") &&
          !line.startsWith("---");

        if (isHunk || isChange) {
          picked.push(line);
          count++;
          if (count >= perFileMaxLines) break;
        }
      }

      if (picked.length > 0) {
        const block = [`# ${file}`, ...picked].join("\n");
        if (block.length <= remaining) {
          parts.push(block);
          remaining -= block.length;
        } else {
          parts.push(block.slice(0, Math.max(0, remaining)));
          remaining = 0;
        }
      }

      if (remaining <= 0) break;
    }

    if (parts.length === 0) return "";
    return parts.join("\n\n");
  } catch {
    return "";
  }
};

// gets a high-level statistical summary
export const getStagedSummary = async (): Promise<string> => {
  const { stdout } = await execa("git", [
    "diff",
    "--staged",
    "--stat",
    ...EXCLUDE,
  ]);
  return stdout;
};
