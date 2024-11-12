import "@std/dotenv/load";
import { cleanEnv, str, url } from "envalid";

const env = cleanEnv(Deno.env.toObject(), {
  DEPLOYMENT_BASE_URL: url(),
  WAKATIME_APP_ID: str(),
  WAKATIME_APP_SECRET: str(),
  WAKATIME_USERS: str(),
  GITHUB_TOKEN: str(),
  GITHUB_ORGS: str(),
  GITHUB_EXCLUDE_USERS: str(),
});

export const WAKATIME_REDIRECT_URI =
  new URL("auth/wakatime/finalize", env.DEPLOYMENT_BASE_URL).href;
export const WAKATIME_APP_ID = env.WAKATIME_APP_ID;
export const WAKATIME_APP_SECRET = env.WAKATIME_APP_SECRET;
export const WAKATIME_USERS = env.WAKATIME_USERS.split(",");
export const GITHUB_TOKEN = env.GITHUB_TOKEN;
export const GITHUB_ORGS = env.GITHUB_ORGS.split(",");
export const GITHUB_EXCLUDE_USERS = env.GITHUB_EXCLUDE_USERS.split(",");
