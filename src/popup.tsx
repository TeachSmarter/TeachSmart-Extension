import React from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  return (
    <div style={{
      width: "200px",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{
        fontSize: "18px",
        color: "#2c3e50",
        margin: "0",
        fontWeight: "500"
      }}>
        TeachSmart Extension
      </h1>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);