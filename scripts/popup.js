import { getActiveTabURL } from "./utils.js";

const addNewMarker = (markers, marker) =>{
  const markerTItleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newMarkerElement = document.createElement("div");

  markerTItleElement.textContent = marker.desc;
  markerTItleElement.className = "marker-title";
  controlsElement.className = "marker-controls";

  setMarkerAttributes("begin", setBegin, controlsElement);
  setMarkerAttributes("end", setEnd, controlsElement);
  setMarkerAttributes("delete", onDelete, controlsElement);

  newMarkerElement.id = "marker-" + marker.time;
  newMarkerElement.className = "marker";
  newMarkerElement.setAttribute("timestamp", marker.time);

  newMarkerElement.appendChild(markerTItleElement);
  newMarkerElement.appendChild(controlsElement);
  markers.appendChild(newMarkerElement);
};

const viewMarkers = (currentMarkers=[]) => {
  const markersElement = document.getElementById("markers");
  markersElement.innerHTML = "";

  if (currentMarkers.length > 0) {
    for (let i = 0; i < currentMarkers.length; i++) {
      const marker = currentMarkers[i];
      addNewMarker(markersElement, marker);
    }
  } else {
    markersElement.innerHTML = '<i class="row">No markers to show</i>';
  }

  return;
};

const setMarkerAttributes = (src, handler, controlsElement) => {
  const markerControlElement = document.createElement("img");

  markerControlElement.src = "assets/" + src + ".png";
  markerControlElement.title = src;
  markerControlElement.addEventListener("click", handler);
  controlsElement.appendChild(markerControlElement);
}



document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    if (activeTab.url == undefined) {
      return;
    }
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
  
    const currentVideo = urlParameters.get("v");
  
    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
      chrome.storage.local.get([currentVideo+"markers"], (data) => {
        const currentVideoMarkers = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
        viewMarkers(currentVideoMarkers);
      });
      chrome.storage.local.get([currentVideo+"flip"], (data) => {
        
        const flipState = data[currentVideo+"flip"];
        
        document.getElementById('mirror').checked = flipState;
      });
      
      document.getElementById('mirror').addEventListener('change', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "flipVideo", videoID: currentVideo});
        });
      });
      

      
      document.getElementById('tempo-value').addEventListener('change', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          
            document.getElementById('tempo').value = document.getElementById('tempo-value').value;
            chrome.tabs.sendMessage(tabs[0].id, {action: "changePlaybackRate", rate: document.getElementById('tempo-value').value, videoID: currentVideo});
            
          });
        });
        document.getElementById('tempo').addEventListener('change', function() {
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            
            document.getElementById('tempo-value').value = document.getElementById('tempo').value;
            chrome.tabs.sendMessage(tabs[0].id, {action: "changePlaybackRate", rate: document.getElementById('tempo').value, videoID: currentVideo});
            
        });
      });

      chrome.storage.local.get([currentVideo+"rate"], (data) => {
        let rate = data[currentVideo+"rate"];
        if (rate == undefined) {
          rate = 1;
        }
        document.getElementById('tempo-value').value = rate;
        document.getElementById('tempo').value = rate;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "changePlaybackRate", rate: rate, videoID: currentVideo});
        });
      });
    } else {
      const container = document.getElementsByClassName("wrapper")[0];
      
      container.innerHTML = '<div class="title">This is not detected as a youtube video page.</div>';
    }
  });
  
  
