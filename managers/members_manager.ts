import { HOUR } from "@std/datetime/constants";
import { GITHUB_EXCLUDE_USERS, GITHUB_ORGS } from "../config.ts";
import { octokit } from "../octokit.ts";

export const membersManager = new class {
  #members = new Array<string>();
  #lastGetMembers: Date | null = null;

  reload() {
    this.#members = [];
    this.#lastGetMembers = null;
  }

  async getMembers() {
    if (
      this.#lastGetMembers == null ||
      (Date.now() - this.#lastGetMembers.getTime() >= 1 * HOUR)
    ) {
      const members = new Array<string>();
      for (const org of GITHUB_ORGS) {
        const response = await octokit.request("GET /orgs/{org}/members", {
          org,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        for (const { login } of response.data) {
          members.push(login);
        }
      }
      this.#members = members.filter((v) => !GITHUB_EXCLUDE_USERS.includes(v));
      this.#members = Array.from(new Set(this.#members));
      this.#lastGetMembers = new Date();
    }
    return this.#members;
  }
}();
