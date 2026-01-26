import { GoogleGenAI } from "@google/genai";
import { getApiKey, getConfig } from "./config.js";
import { KnownError } from "./error.js";

const buildPrompt = (
  diffSnippets: string,
  fileList: string[],
  maxLength: number,
  count: number,
) => `You are an expert developer writing git commit messages.

CHANGES:
Files: ${fileList.join(", ")}

${diffSnippets ? `CODE DIFF:\n${diffSnippets}` : ""}

TASK: Generate ${count} different commit message${count > 1 ? "s" : ""} for these changes.

FORMAT RULES:
- Use Conventional Commits: <type>: <subject>
- NO scope (use "feat: add login" NOT "feat(auth): add login")
- Maximum ${maxLength} characters per message
- Use imperative mood ("add" not "added")
- Be specific but concise

TYPES:
- feat: NEW user-facing feature
- fix: bug fix
- docs: documentation only
- style: formatting, missing semi-colons
- refactor: code change without new feature or fix
- perf: performance improvement
- test: adding/correcting tests
- build: build system, dependencies
- ci: CI configuration
- chore: maintenance, config updates

EXAMPLES (correct):
- feat: add user authentication with JWT
- fix: resolve memory leak in image processor
- refactor: simplify error handling logic

WRONG (do not use scope):
- feat(auth): add login

Output ${count > 1 ? `exactly ${count} commit messages, one per line` : "only the commit message"}, no explanations or numbering.`;

/** Options for generating commit messages */
export interface GenerateOptions {
  diffSnippets: string;
  files: string[];
  maxLength?: number;
  count?: number;
  timeout?: number;
}

// Generates commit messages using Gemini
export const generateCommitMessages = async (
  options: GenerateOptions,
): Promise<string[]> => {
  const apiKey = getApiKey();
  const model = getConfig("model");
  const maxLength = options.maxLength ?? getConfig("maxLength");
  const count = options.count ?? getConfig("generate");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(
    options.diffSnippets,
    options.files,
    maxLength,
    count,
  );

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new KnownError("AI returned empty response. Please try again");
    }

    // Parse response: split by newlines, remove empty lines
    const messages = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+\./))
      .map((line) => line.replace(/^[-*]\s*/, ""));

    if (messages.length === 0) {
      throw new KnownError("AI returned no valid commit messages.");
    }

    return messages.slice(0, count);
  } catch (error: any) {
    if (error instanceof KnownError) {
      throw error;
    }

    if (error.message?.includes("API key")) {
      throw new KnownError(
        "Invalid Gemini API Key. Run: nc config set GEMINI_API_KEY=<key>",
      );
    }
    if (error.message?.includes("Quota")) {
      throw new KnownError(
        "API quota exceeded. Please check your Gemini API usage limits.",
      );
    }
    if (error.message?.includes("network") || error.code === "ENOTFOUND") {
      throw new KnownError(
        "Network error. Please check your internet connection.",
      );
    }
    throw new KnownError(`AI error: ${error.message}`);
  }
};

// generate a single commit message
export const generateCommitMessage = async (diff: string): Promise<string> => {
  const messages = await generateCommitMessages({
    diffSnippets: diff,
    files: [],
    count: 1,
  });
  return messages[0] || "";
};
