import { WAKATIME_APP_ID, WAKATIME_APP_SECRET } from "../config.ts";
import { WakaTimeCredentials } from "../models/wakatime_credentials.ts";

export const wakatimeCredentialsManager = new class {
  async regenerateAccessToken(username: string, refreshToken: string) {
    const data = {
      grant_type: "refresh_token",
      client_id: WAKATIME_APP_ID,
      client_secret: WAKATIME_APP_SECRET,
      refresh_token: refreshToken,
    };
    for (let i = 0; i < 3; ++i) {
      const response = await fetch("https://wakatime.com/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.text();
      if (!response.ok) {
        console.error(
          "Got non-200 response from WakaTime[3]:",
          response.status,
          response.statusText,
        );
        console.error(body);
        continue;
      }
      const params = new URLSearchParams(body);
      const accessToken = params.get("access_token")!;
      const refreshToken = params.get("refresh_token")!;
      await WakaTimeCredentials.update({ accessToken, refreshToken }, {
        where: { username },
      });
    }
  }
}();
