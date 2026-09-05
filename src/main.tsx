import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/particles.css";
import "./styles/global.css";
import "./styles/showcase.css";

const root = document.getElementById("root");
if (!root) throw new Error("The particle showcase requires a root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
