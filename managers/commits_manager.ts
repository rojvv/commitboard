import { octokit } from "../octokit.ts";

export const commitsManager = new class {
  async getCommit(owner: string, repo: string, ref: string) {
    return (await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      {
        owner,
        repo,
        ref,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    )).data;
  }
}();
