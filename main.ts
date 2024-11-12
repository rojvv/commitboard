import { Hono } from "@hono/hono";
import { serveStatic, upgradeWebSocket } from "@hono/hono/deno";
import { webSocketManager } from "./managers/websocket_manager.ts";
import { githubStatsManager } from "./managers/github_stats_manager.ts";
import { webhookManager } from "./managers/webhook_manager.ts";
import { init } from "./sequelize.ts";
import { wakatimeStatsManager } from "./managers/wakatime_stats_manager.ts";
import {
  WAKATIME_APP_ID,
  WAKATIME_APP_SECRET,
  WAKATIME_REDIRECT_URI,
} from "./config.ts";
import { WakaTimeCredentials } from "./models/wakatime_credentials.ts";
import { membersManager } from "./managers/members_manager.ts";

const app = new Hono();

app.use(async (_, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Error handling request:", err);
  }
});

app.post("/", async (c, next) => {
  const event = c.req.header("x-github-event");
  if (!event) {
    return await next();
  }
  if (event != "push") {
    return c.json(null);
  }
  const payload = await c.req.json();
  await webhookManager.processPush(payload);
  return c.json(null);
});

app.get("/api", async (c) => {
  c.header("content-type", "application/json");
  const merged = await githubStatsManager.getGithubStats("merged");
  const changed = await githubStatsManager.getGithubStats("changed");
  const github = { merged, changed };
  const wakatime = await wakatimeStatsManager.getWakatimeStats();
  return c.text(JSON.stringify({ github, wakatime }, null, 2) + "\n");
});

app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onOpen(_, ws) {
      if (ws.raw) webSocketManager.add(ws.raw);
    },
    onMessage() {},
    onClose: (_, ws) => {
      if (ws.raw) webSocketManager.remove(ws.raw);
    },
  })),
);

app.get("/auth/wakatime", (c) => {
  const url = new URL("https://wakatime.com/oauth/authorize");
  url.searchParams.set("client_id", WAKATIME_APP_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", WAKATIME_REDIRECT_URI);
  url.searchParams.set("scope", "read_heartbeats");
  return c.redirect(url.href);
});

app.get("/auth/wakatime/finalize", async (c, next) => {
  const code = c.req.query("code");
  if (!code) {
    return await next();
  }
  const data = {
    client_id: WAKATIME_APP_ID,
    client_secret: WAKATIME_APP_SECRET,
    redirect_uri: WAKATIME_REDIRECT_URI,
    grant_type: "authorization_code",
    code,
  };
  const response = await fetch("https://wakatime.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.text();
  if (!response.ok) {
    console.log(
      "Got non-200 resposne from WakaTime[0]:",
      response.status,
      response.statusText,
    );
    console.log(body);
    return new Response("An unexpected error occurred.", { status: 500 });
  }
  const params = new URLSearchParams(body);
  const accessToken = params.get("access_token")!;
  const refreshToken = params.get("refresh_token")!;
  const uid = params.get("uid")!;
  {
    const response = await fetch("https://wakatime.com/api/v1/users/current", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.text();
      console.log(
        "Got non-200 resposne from WakaTime[1]:",
        response.status,
        response.statusText,
      );
      console.log(body);
      return new Response("An unexpected error occurred.", { status: 500 });
    }
    const { data } = await response.json();
    const username = data.username;
    if (!username) {
      return new Response("You must set a username for WakaTime.", {
        status: 400,
      });
    }
    try {
      await WakaTimeCredentials.destroy({ where: { uid } });
    } catch {
      //
    }
    await WakaTimeCredentials.create({
      date: new Date(),
      accessToken,
      refreshToken,
      uid,
      username,
    });
    return new Response("Credentials saved.");
  }
});

app.get("/reload", (c) => {
  wakatimeStatsManager.reload();
  membersManager.reload();
  webSocketManager.broadcast("");
  return c.text("Reloaded.");
});

app.get("*", serveStatic({ root: "./app/dist" }));

setTimeout(init);
Deno.serve({
  hostname: "127.0.0.1",
  port: Number(Deno.env.get("PORT")) || 3333,
}, app.fetch);
