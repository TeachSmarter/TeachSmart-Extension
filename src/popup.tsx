
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [isIconEnabled, setIsIconEnabled] = useState(false);

  const toggleIcon = async () => {
    const newState = !isIconEnabled;
    setIsIconEnabled(newState);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleIcon",
        show: newState
      });
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      minWidth: "300px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        color: "#333",
        marginBottom: "20px",
        fontSize: "18px"
      }}>
        Teach Assistant
      </h2>
      
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "15px"
        }}
      >
        <label className="switch" style={{
          position: "relative",
          display: "inline-block",
          width: "60px",
          height: "34px"
        }}>
          <input 
            type="checkbox"
            checked={isIconEnabled}
            onChange={toggleIcon}
            style={{
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <span style={{
            position: "absolute",
            cursor: "pointer",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isIconEnabled ? "#4CAF50" : "#ccc",
            transition: "0.4s",
            borderRadius: "34px",
            "&:before": {
              position: "absolute",
              content: '""',
              height: "26px",
              width: "26px",
              left: "4px",
              bottom: "4px",
              backgroundColor: "white",
              transition: "0.4s",
              borderRadius: "50%",
              transform: isIconEnabled ? "translateX(26px)" : "translateX(0)"
            }
          }}/>
        </label>
      </div>
      
      <div style={{
        textAlign: "center",
        color: "#666",
        fontSize: "14px"
      }}>
        {isIconEnabled ? "Assistant Enabled" : "Assistant Disabled"}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
