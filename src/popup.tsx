import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [isIconEnabled, setIsIconEnabled] = useState(false);

  const toggleIcon = async () => {
    const newState = !isIconEnabled;
    setIsIconEnabled(newState);

    // Send message to active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleIcon",
        show: newState
      });
    }
  };

  return (
    <div style={{ padding: "20px", minWidth: "300px" }}>
      <button 
        onClick={toggleIcon}
        style={{
          padding: "10px 20px",
          backgroundColor: isIconEnabled ? "#ff4444" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%"
        }}
      >
        {isIconEnabled ? "Disable Icon" : "Enable Icon"}
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);