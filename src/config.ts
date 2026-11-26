import Conf from "conf";
import { chmodSync } from "fs";
import { KnownError } from "./error.js";

export interface ConfigSchema {
  GEMINI_API_KEY: string;
  model: string;
  maxLength: number;
}

// The file holds the API key, so only the owner may read it
const config = new Conf<ConfigSchema>({
  projectName: "nocommit",
  configFileMode: 0o600,
  defaults: {
    GEMINI_API_KEY: "",
    model: "gemini-3.5-flash-lite",
    maxLength: 72,
  },
});

// configFileMode only applies on write; also tighten files made by older versions.
// Best effort: some file systems (e.g. Windows) cannot chmod, and that must not stop the CLI.
try {
  chmodSync(config.path, 0o600);
} catch {}

// get Config
export const getConfig = <K extends keyof ConfigSchema>(
  key: K,
): ConfigSchema[K] => {
  return config.get(key);
};

// set Config
export const setConfig = <K extends keyof ConfigSchema>(
  key: K,
  value: ConfigSchema[K],
) => {
  config.set(key, value);
};

export const getApiKey = () => {
  const key = config.get("GEMINI_API_KEY");
  if (!key) {
    throw new KnownError(
      "Missing API Key. Run: nocommit config set GEMINI_API_KEY=<your-api-key>",
    );
  }
  return key;
};
