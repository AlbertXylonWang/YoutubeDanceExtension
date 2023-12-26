chrome.tabs.onUpdated.addListener((tabId, tab) => {
    console.log("tab updated")
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      console.log("youtube video detected");

      chrome.tabs.sendMessage(tabId, {
        action: "NEW_VIDEO",
        videoId: urlParameters.get("v"),
      });
    }
  });

  chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({url: cs.matches})) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: cs.js,
      });
    }
  }
});
  