import Conf from "conf";
import { KnownError } from "./error.js";

export interface ConfigSchema {
  GEMINI_API_KEY: string;
  model: string;
  maxLength: number;
  timeout: number;
  generate: number;
}

const config = new Conf<ConfigSchema>({
  projectName: "nocommit",
  defaults: {
    GEMINI_API_KEY: "",
    model: "gemini-2.5-flash",
    maxLength: 72,
    timeout: 30000,
    generate: 3,
  },
});

// export const getConfig = (key: string) => {
//     return config.get(key as any);
//   };

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

export const getAllConfig = (): ConfigSchema => {
  return config.store;
};

export const getApiKey = () => {
  const key = config.get("GEMINI_API_KEY");
  if (!key) {
    throw new KnownError(
      "Missing API Key. Run: nc config set GEMINI_API_KEY=<Key Your API Key>",
    );
  }
  return key;
};
