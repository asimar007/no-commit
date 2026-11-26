import { GoogleGenAI } from "@google/genai";
import { getApiKey, getConfig } from "./config.js";
import { KnownError } from "./error.js";

const buildPrompt = (
  diffSnippets: string,
  fileList: string[],
  maxLength: number,
) => `You are an expert developer writing git commit messages.

CHANGES:
Files: ${fileList.join(", ")}

${diffSnippets ? `CODE DIFF:\n${diffSnippets}` : ""}

TASK: Generate one commit message for these changes.

FORMAT RULES:
- Use Conventional Commits: <type>: <subject>
- NO scope (use "feat: add login" NOT "feat(auth): add login")
- Maximum ${maxLength} characters
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

Output only the commit message, no explanations or numbering.`;

// Cleans the raw AI reply into commit messages: drops code fences, strips numbering and bullets
export const parseCommitMessages = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("```"))
    .map((line) => line.replace(/^(\d+[.)]|[-*])\s*/, ""))
    .filter((line) => line.length > 0);

// Generates a commit message using Gemini
export const generateCommitMessage = async (
  diffSnippets: string,
  files: string[],
): Promise<string> => {
  const apiKey = getApiKey();
  const model = getConfig("model");
  const maxLength = getConfig("maxLength");

  // SDK 3.x defaults to API v1, which lacks preview models; v1beta serves every model
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const prompt = buildPrompt(diffSnippets, files, maxLength);

  try {
    // No maxOutputTokens: on thinking models it also caps thinking and can leave the answer empty
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.7 },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new KnownError("AI returned empty response. Please try again");
    }

    const [message] = parseCommitMessages(text);
    if (!message) {
      throw new KnownError("AI returned no valid commit messages.");
    }
    return message;
  } catch (error: any) {
    if (error instanceof KnownError) {
      throw error;
    }

    if (error.message?.includes("API key")) {
      throw new KnownError(
        "Invalid Gemini API Key. Run: nocommit config set GEMINI_API_KEY=<key>",
      );
    }
    if (error.status === 429) {
      throw new KnownError(
        "API quota exceeded. Please check your Gemini API usage limits.",
      );
    }
    // Node's fetch reports DNS, refused and reset connections all as "fetch failed"
    if (error.message?.includes("fetch failed")) {
      throw new KnownError(
        "Network error. Please check your internet connection.",
      );
    }
    throw new KnownError(`AI error: ${error.message}`);
  }
};
