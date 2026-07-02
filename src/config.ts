import Conf from "conf";
import { KnownError } from "./error.js";

export interface ConfigSchema {
  GEMINI_API_KEY: string;
  model: string;
  maxLength: number;
  generate: number;
}

const config = new Conf<ConfigSchema>({
  projectName: "nocommit",
  defaults: {
    GEMINI_API_KEY: "",
    model: "gemini-2.5-flash",
    maxLength: 72,
    generate: 3,
  },
});

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
