import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const iconOptions = [
  { id: 'teacher', src: 'icons/teacher.png', alt: 'Teacher' },
  { id: 'assistant', src: 'icons/assistant.png', alt: 'Assistant' },
  { id: 'books', src: 'icons/books.png', alt: 'Books' }
];

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('teacher');

  useEffect(() => {
    chrome.storage.sync.get(['isEnabled', 'selectedIcon'], (result) => {
      if (result.isEnabled !== undefined) {
        setIsEnabled(result.isEnabled);
      }
      if (result.selectedIcon) {
        setSelectedIcon(result.selectedIcon);
      }
    });
  }, []);

  const toggleAssistant = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

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
      width: "300px",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <h1 style={{
        fontSize: "18px",
        color: "#2c3e50",
        textAlign: "center",
        margin: "0 0 20px 0",
        borderBottom: "2px solid #3498db",
        paddingBottom: "10px"
      }}>
        TeachSmart
        <div style={{ 
          fontSize: "14px", 
          color: "#7f8c8d",
          marginTop: "5px" 
        }}>
          Your Best Teaching Assistant
        </div>
      </h1>

      <div style={{
        marginBottom: "20px",
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px"
        }}>
          <span style={{ fontWeight: "500" }}>Enable Assistant</span>
          <div className="toggle-switch" style={{
            position: "relative",
            width: "50px",
            height: "26px",
            backgroundColor: isEnabled ? "#2ecc71" : "#95a5a6",
            borderRadius: "13px",
            cursor: "pointer",
            transition: "0.3s"
          }} onClick={toggleAssistant}>
            <div style={{
              position: "absolute",
              top: "3px",
              left: isEnabled ? "27px" : "3px",
              width: "20px",
              height: "20px",
              backgroundColor: "white",
              borderRadius: "50%",
              transition: "0.3s"
            }}/>
          </div>
        </label>
      </div>

      <div style={{
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          fontSize: "14px",
          marginBottom: "10px",
          color: "#2c3e50"
        }}>Choose Icon</h2>
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          gap: "10px"
        }}>
          {iconOptions.map((icon) => (
            <div
              key={icon.id}
              onClick={() => setSelectedIcon(icon.id)}
              style={{
                padding: "5px",
                border: selectedIcon === icon.id ? "2px solid #3498db" : "2px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "0.3s"
              }}
            >
              <img
                src={icon.src}
                alt={icon.alt}
                style={{
                  width: "40px",
                  height: "40px",
                  opacity: selectedIcon === icon.id ? 1 : 0.6
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: "15px",
        textAlign: "center",
        fontSize: "12px",
        color: "#95a5a6"
      }}>
        TeachSmart v1.0
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