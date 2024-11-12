<script lang="ts">
import { MINUTE, SECOND } from "@std/datetime/constants";
import { onMount } from "svelte";
import Loading from "./components/Loading.svelte";
import Title from "./components/Title.svelte";
import { countUpManager } from "./count_up_manager";

interface Data {
  wakatime: [string, string][];
  github: {
    merged: string[];
    changed: string[];
  };
}

let loading = $state(true);
let lastData: Data = { wakatime: [], github: { merged: [], changed: [] } };
let data = $state<Data>({ wakatime: [], github: { merged: [], changed: [] } });
const audio = new Audio("/audio.wav");

let lastReload: Date | null = null;
async function reload() {
  lastReload = new Date();
  const response = await fetch("/api");
  if (!response.ok) {
    return;
  }
  data = await response.json();
  if (JSON.stringify(data) != JSON.stringify(lastData)) {
    setTimeout(() => {
      for (const k in data.github) {
        for (const [member, value] of data.github[k]) {
          const countUp = countUpManager.getCountUp(`${k}_${member}`);
          if (!countUp) continue;
          countUp.update(value);
        }
      }
      audio.play();
    });
  }
  lastData = data;
  loading = false;
}

function newWebSocket() {
  const url = new URL("/ws", location.href);
  url.protocol = url.protocol.includes("s") ? "wss:" : "ws:";
  const ws = new WebSocket(url);
  ws.onmessage = reload;
  return ws;
}
onMount(() => {
  globalThis.reload = reload;
  reload();

  let ws = newWebSocket();

  Promise.resolve().then(async () => {
    while (true) {
      await new Promise(r => setTimeout(r, 1 * SECOND));
      if (!lastReload) continue;
      if (
        ws.readyState != WebSocket.OPEN
        || Date.now() - lastReload.getTime() >= 1 * MINUTE
      ) {
        try {
          ws.close();
        } catch {
          //
        }
        console.log("reiniting ws");
        ws = newWebSocket();
        reload();
      }
    }
  });
});
</script>

<main>
  {#if loading}
    <Loading />
  {:else}
    <div class="section">
      <Title>time spent coding today</Title>
      <div class="items">
        {#each data.wakatime as [user, dur], i (user)}
          <div class="item">
            <div>
              <span class="index">{#if data.wakatime.length > 10}&nbsp;{/if}{
                  i
                }</span>.
              <span>{user}</span>
            </div>
            <span class="duration">{dur}</span>
          </div>
        {/each}
      </div>
    </div>
    {#each Object.entries(data.github) as [k, rows], i}
      <div class="section">
        <Title>
          {#if k == "changed"}
            changes made today
          {:else}
            changes merged today
          {/if}
        </Title>
        <div class="items">
          {#each rows as [member], i (member)}
            <div class="item">
              <div>
                <span class="index">{#if rows.length > 10}&nbsp;{/if}{i}</span>.
                <span>{member}</span>
              </div>
              <span data-count-up="{k}_{member}" class="count"></span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</main>

<style>
main {
  display: flex;
  flex-direction: column;
  gap: 50px;
  width: 100vh;
  padding: 34px 64px;
  align-items: center;
}

.items {
  width: 100%;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 23px;
}

.count, .duration {
  opacity: 0.5;
}

.index {
  font-family: "Roboto Mono", monospace;
}

.index, .count {
  font-feature-settings: "zero";
}

.section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
