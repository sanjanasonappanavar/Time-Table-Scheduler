// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ⤵️ Import React DnD provider and backend
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Get the root DOM element
const rootElement = document.getElementById("root");

// Bootstrap the React app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* Global Drag-and-Drop Context */}
    <DndProvider backend={HTML5Backend}>
      <App />
    </DndProvider>
  </React.StrictMode>
);
