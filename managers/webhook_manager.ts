import { Commit } from "../models/commit.ts";
import { octokit } from "../octokit.ts";
import { webSocketManager } from "./websocket_manager.ts";

export const webhookManager = new class {
  // deno-lint-ignore no-explicit-any
  async processPush(payload: any) {
    const { repository, ref, commits } = payload;
    const branch = ref.split("/")[2] ?? ref;
    await this.#saveCommits(repository, branch, commits);
    webSocketManager.broadcast("");
  }

  // deno-lint-ignore no-explicit-any
  async #saveCommits(repository: any, branch: string, commits: any[]) {
    const promises = new Array<Promise<void>>();
    for (const commit of commits) {
      promises.push(
        Promise.resolve().then(async () => {
          const response = await octokit.request(
            "GET /repos/{owner}/{repo}/commits/{ref}",
            {
              owner: repository.owner.login,
              repo: repository.name,
              ref: commit.id,
              headers: {
                "X-GitHub-Api-Version": "2022-11-28",
              },
            },
          );

          const date = new Date(response.data.commit?.committer?.date ?? 0);
          const author = response.data.author?.login;
          const id = response.data.sha;
          const totalChanges = response.data.stats?.total;
          if (
            !date.getTime() || !author || !id ||
            typeof totalChanges !== "number"
          ) {
            return;
          }
          {
            const commit = {
              date,
              repository: repository.full_name,
              branch,
              author,
              id,
              totalChanges,
            };
            await Commit.create(commit);
            console.log(
              "Saved commit",
              id,
              "of",
              repository.full_name + ":",
              commit,
            );
          }
        }),
      );
    }
    await Promise.all(promises);
  }
}();
