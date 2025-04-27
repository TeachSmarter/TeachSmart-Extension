
import React from 'react';
import { createRoot } from 'react-dom/client';

// Listen for background messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === "toggleIcon") {
    const existingIcon = document.getElementById('floating-icon');
    if (msg.show && !existingIcon) {
      createFloatingIcon();
    } else if (!msg.show && existingIcon) {
      existingIcon.remove();
    }
    sendResponse({ success: true });
  }
});

function createFloatingIcon() {
  const icon = document.createElement('div');
  icon.id = 'floating-icon';
  icon.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 50px;
    height: 50px;
    background-color: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  icon.innerHTML = '➕';
  icon.addEventListener('click', () => {
    alert('Icon clicked!');
  });
  
  document.body.appendChild(icon);
}
