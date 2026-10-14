import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/index.css";

// index.html carries static <title>/meta for crawlers without JS; React renders per-route ones.
document.querySelectorAll("[data-static-meta]").forEach((el) => el.remove());

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
