import { getActiveTabURL } from "./utils.js";






document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
  
    const currentVideo = urlParameters.get("v");
  
    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
      chrome.storage.sync.get([currentVideo+"markers"], (data) => {
        const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
  
        
      });

 
      document.getElementById('mirror').addEventListener('change', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "flipVideo"});
            console.log('flipAttempt');
        });
      });

      chrome.storage.sync.get([currentVideo+"flip"], (data) => {
        const flipState = data[currentVideo+"flip"];
        console.log(flipState);
        document.getElementById('mirror').checked = flipState;
      });
    } else {
      const container = document.getElementsByClassName("wrapper")[0];
      
      container.innerHTML = '<div class="title">This is not detected as a youtube video page.</div>';
    }
  });
  
  
