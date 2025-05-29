// Background script for TeachSmart extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'openMainWindow') {
    // Store selected text for popup to access
    chrome.storage.local.set({ 
      selectedText: message.selectedText,
      timestamp: Date.now()
    });
    
    // Note: Popup will be opened when user clicks extension icon
    // The selected text is now stored and ready for popup to access
    
    sendResponse({ success: true });
  }
});

// Optional: Clean up old data periodically
function cleanupOldData() {
  chrome.storage.local.get(['timestamp'], (result) => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (result.timestamp && (now - result.timestamp) > fiveMinutes) {
      chrome.storage.local.clear();
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupOldData, 5 * 60 * 1000);