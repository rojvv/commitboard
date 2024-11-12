import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

addEventListener("click", () => {
  document.documentElement.requestFullscreen();
});

export default app;
