import { Op } from "sequelize";

import { Commit } from "../models/commit.ts";
import { membersManager } from "./members_manager.ts";

export const githubStatsManager = new class {
  async getGithubStats(type: "merged" | "changed") {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);
    const members = await membersManager.getMembers();
    const stats = new Array<[string, number]>();
    for (const author of members) {
      const sum = await Commit.sum("totalChanges", {
        where: {
          ...(type == "merged"
            ? {
              author: { [Op.like]: author },
              [Op.or]: [{ branch: "main" }, { branch: "master" }],
            }
            : {
              author: { [Op.like]: author },
              [Op.and]: [
                { branch: { [Op.ne]: "main" } },
                { branch: { [Op.ne]: "master" } },
              ],
            }),
          date: { [Op.gte]: today },
        },
      });
      stats.push([author, sum || 0]);
    }
    return stats
      .sort(([a], [b]) => a.localeCompare(b))
      .sort(([, a], [, b]) => a == b ? 0 : a > b ? -1 : 1);
  }
}();
