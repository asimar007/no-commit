import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// Keep the real user config and git config out of the tests
const home = mkdtempSync(join(tmpdir(), "nocommit-test-"));
Object.assign(process.env, {
  HOME: home,
  XDG_CONFIG_HOME: home,
  APPDATA: home,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com",
});

const { parseCommitMessages } = await import("../dist/ai.js");
const { getStagedFiles, buildDiffSnippets } = await import("../dist/git.js");

test("parseCommitMessages strips numbering, bullets and code fences", () => {
  assert.deepEqual(
    parseCommitMessages("```\n1. feat: add login\n2) fix: typo\n- docs: readme\n* chore: x\n```"),
    ["feat: add login", "fix: typo", "docs: readme", "chore: x"],
  );
  assert.deepEqual(parseCommitMessages("```text\n```"), []);
});

test("staged files and diff work from a subfolder and skip lock files only in the diff", async () => {
  const repo = join(home, "repo");
  mkdirSync(join(repo, "src"), { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });
  git("init", "-q");
  writeFileSync(join(repo, "src", "a.ts"), "one\n");
  writeFileSync(join(repo, "package-lock.json"), "{}\n");
  git("add", ".");
  git("commit", "-q", "-m", "init");

  writeFileSync(join(repo, "src", "a.ts"), "two\n");
  writeFileSync(join(repo, "package-lock.json"), '{"a":1}\n');
  git("add", ".");

  process.chdir(join(repo, "src"));
  assert.deepEqual(await getStagedFiles(), ["package-lock.json", "src/a.ts"]);
  const diff = await buildDiffSnippets();
  assert.match(diff, /^# src\/a\.ts\n/);
  assert.match(diff, /\+two/);
  assert.doesNotMatch(diff, /package-lock/);

  // A lock-file-only change still counts as staged (run from the root, where excludes used to apply)
  process.chdir(repo);
  git("commit", "-q", "-m", "next");
  writeFileSync(join(repo, "package-lock.json"), '{"a":2}\n');
  git("add", "package-lock.json");
  assert.deepEqual(await getStagedFiles(), ["package-lock.json"]);
  assert.equal(await buildDiffSnippets(), "");
});
