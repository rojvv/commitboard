import { Octokit } from "octokit";
import { GITHUB_TOKEN } from "./config.ts";

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});
