import { format } from "@std/fmt/duration";
import { MINUTE } from "@std/datetime/constants";
import { Op } from "sequelize";
import { WAKATIME_USERS } from "../config.ts";
import { WakaTimeStats } from "../models/wakatime_stats.ts";
import { WakaTimeCredentials } from "../models/wakatime_credentials.ts";
import { wakatimeCredentialsManager } from "./wakatime_credentials_manager.ts";

const RANGE = "last_7_days";

export const wakatimeStatsManager = new class {
  #lastStats: [string, string, number][] | null = null;
  #lastGetStats: Date | null = null;

  reload() {
    this.#lastStats = null;
    this.#lastGetStats = null;
  }

  async getWakatimeStats() {
    if (
      this.#lastStats != null && this.#lastGetStats != null &&
      (Date.now() - this.#lastGetStats.getTime()) <= 15 * MINUTE
    ) {
      return this.#lastStats;
    }
    const stats = new Array<[string, string, number]>();
    const promises = await Promise.allSettled(
      WAKATIME_USERS.map((v) => {
        return this.getDurations(v);
      }),
    );
    for (const [i, promise] of promises.entries()) {
      if (promise.status == "fulfilled" && promise.value != null) {
        const totalSeconds = Math.floor(Math.floor(promise.value / 60) * 60);
        const humanReadableTotal = format(totalSeconds * 1000, {
          ignoreZero: true,
        }).replace(/ [0-9]*ms/, "").trim();
        await WakaTimeStats.destroy({
          where: {
            user: WAKATIME_USERS[i],
            range: RANGE,
          },
        });
        await WakaTimeStats.create({
          date: new Date(),
          user: WAKATIME_USERS[i],
          range: RANGE,
          totalSeconds,
          humanReadableTotal,
        });
      }
      const entry = await WakaTimeStats.findOne({
        where: {
          user: WAKATIME_USERS[i],
          range: RANGE,
        },
      });
      if (entry && entry.dataValues.humanReadableTotal) {
        stats.push([
          WAKATIME_USERS[i],
          entry.dataValues.humanReadableTotal,
          entry.dataValues.totalSeconds,
        ]);
      } else {
        stats.push([WAKATIME_USERS[i], "---", 0]);
      }
    }
    this.#lastGetStats = new Date();
    return this.#lastStats = stats.sort((a, b) => a[0].localeCompare(b[0]))
      .sort(([, , a], [, , b]) => a == b ? 0 : a > b ? -1 : 1);
  }

  async getDurations(username: string): Promise<number | null> {
    const data = (await this.getDurationsRaw(username, new Date())) as {
      duration: number;
    }[];
    if (data == null) return null;
    return data.map((v) => v.duration).reduce((a, b) => a + b, 0);
  }

  async getDurationsRaw(
    username: string,
    date: Date,
    // deno-lint-ignore no-explicit-any
  ): Promise<Record<string, any> | null> {
    for (let i = 0; i < 2; ++i) {
      const result = await WakaTimeCredentials.findOne({
        where: { username: { [Op.like]: username } },
      });
      if (!result) {
        return null;
      }
      const authorization = `Bearer ${result.accessToken}`;
      const url = new URL(
        "https://wakatime.com/api/v1/users/current/durations",
      );
      url.searchParams.set("date", date.toISOString());
      const response = await fetch(url, { headers: { authorization } });
      if (!response.ok) {
        const body = await response.text();
        console.log(
          "Got non-200 response from WakaTime[2]:",
          response.status,
          response.statusText,
        );
        console.log(body);
        await wakatimeCredentialsManager.regenerateAccessToken(
          result.username,
          result.refreshToken,
        );
        continue;
      }
      const { data } = await response.json();
      return data;
    }
    return null;
  }
}();
