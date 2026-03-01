// AChave Background Service Worker
// Handles auth state persistence and context menu actions

chrome.runtime.onInstalled.addListener(() => {
  console.log("AChave extension installed.");
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_AUTH_TOKEN") {
    chrome.storage.local.get(["achave_token"], (result) => {
      sendResponse({ token: result.achave_token || null });
    });
    return true; // async response
  }

  if (message.type === "SET_AUTH_TOKEN") {
    chrome.storage.local.set({ achave_token: message.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "CLEAR_AUTH_TOKEN") {
    chrome.storage.local.remove(["achave_token", "achave_keys"], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "GET_KEYS") {
    chrome.storage.local.get(["achave_keys"], (result) => {
      sendResponse({ keys: result.achave_keys ? JSON.parse(result.achave_keys) : null });
    });
    return true;
  }

  if (message.type === "SET_KEYS") {
    chrome.storage.local.set({ achave_keys: JSON.stringify(message.keys) }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "CLEAR_KEYS") {
    chrome.storage.local.remove(["achave_keys"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
