// Content script for text selection detection

let selectedText = '';
let floatingButton: HTMLElement | null = null;
let selectionTimeout: NodeJS.Timeout;

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection() {
  clearTimeout(selectionTimeout);
  
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    
    if (text.length > 0 && text.length <= 2000) {
      selectedText = text;
      showFloatingButton();
    } else {
      selectedText = '';
      hideFloatingButton();
    }
  }, 100);
}

function showFloatingButton() {
  if (floatingButton) {
    hideFloatingButton();
  }
  
  floatingButton = document.createElement('div');
  floatingButton.id = 'teachsmart-floating-button';
  floatingButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    cursor: pointer;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 10px;
    font-weight: 500;
    border: none;
    opacity: 0;
    transform: translateY(-10px);
  `;
  
  floatingButton.innerHTML = `
    <div style="font-size: 16px; margin-bottom: 2px;">✨</div>
    <div>生成</div>
  `;
  
  floatingButton.addEventListener('click', handleFloatingButtonClick);
  
  document.body.appendChild(floatingButton);
  
  // Trigger animation
  setTimeout(() => {
    if (floatingButton) {
      floatingButton.style.opacity = '1';
      floatingButton.style.transform = 'translateY(0)';
    }
  }, 10);
  
  // Add hover effect
  floatingButton.addEventListener('mouseenter', () => {
    if (floatingButton) {
      floatingButton.style.transform = 'translateY(-2px)';
      floatingButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    }
  });
  
  floatingButton.addEventListener('mouseleave', () => {
    if (floatingButton) {
      floatingButton.style.transform = 'translateY(0)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }
  });
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.opacity = '0';
    floatingButton.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (floatingButton && floatingButton.parentNode) {
        floatingButton.parentNode.removeChild(floatingButton);
      }
      floatingButton = null;
    }, 300);
  }
}

function handleFloatingButtonClick() {
  hideFloatingButton();
  openMainWindow();
}

function openMainWindow() {
  // Send message to background script to open main window
  chrome.runtime.sendMessage({
    action: 'openMainWindow',
    selectedText: selectedText
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    sendResponse({ selectedText: selectedText });
  } else if (message.action === 'clearSelectedText') {
    selectedText = '';
    hideFloatingButton();
    sendResponse({ success: true });
  }
});

// Hide floating button when selection is lost
document.addEventListener('selectionchange', () => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      setTimeout(() => {
        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.toString().trim().length === 0) {
          selectedText = '';
          hideFloatingButton();
        }
      }, 500);
    }
  }, 100);
});