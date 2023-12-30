import { getActiveTabURL } from "./utils.js";

const addNewMarker = (markers, marker) =>{
  const markerTItleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newMarkerElement = document.createElement("div");

  markerTItleElement.textContent = marker.desc;
  markerTItleElement.className = "marker-title";
  controlsElement.className = "marker-controls";

  setMarkerAttributes("begin", setMarkerStart, controlsElement);
  setMarkerAttributes("end", setMarkerEnd, controlsElement);
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

const setMarkerStart = async e => {
  const activeTab = await getActiveTabURL();
  const markerTime = e.target.parentNode.parentNode.getAttribute("timestamp");

  clearHighlights('marker-control:begin');
  // Add highlight to the clicked image's parent
  e.target.classList.add('highlight');

  chrome.tabs.sendMessage(activeTab.id, {
    action: "setMarkerStart",
    time: markerTime,
  });
}
const setMarkerEnd = async e => {
  const activeTab = await getActiveTabURL();
  const markerTime = e.target.parentNode.parentNode.getAttribute("timestamp");

  clearHighlights('marker-control:end');
    // Add highlight to the clicked image's parent
  e.target.classList.add('highlight');


  chrome.tabs.sendMessage(activeTab.id, {
    action: "setMarkerEnd",
    time: markerTime,
  });
}
const onDelete = async e => {
  const activeTab = await getActiveTabURL();

  const markerTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const markerElementToDelete = document.getElementById(
    "marker-" + markerTime
  );
  markerElementToDelete.parentNode.removeChild(markerElementToDelete);
  chrome.tabs.sendMessage(activeTab.id, {
    action: "deleteMarker",
    time: markerTime,
  });

}

function clearHighlights(iconClass){
  
  // Select all images
  const images = document.getElementsByClassName(iconClass);

  Array.from(images).forEach(img => {
    // Remove highlight from all images of the same class
    img.classList.remove('highlight');
  });

}

const setMarkerAttributes = (src, handler, controlsElement) => {
  const markerControlElement = document.createElement("img");
  markerControlElement.className = "marker-control:"+src;
  markerControlElement.src = chrome.runtime.getURL("assets/" + src + ".png");
  markerControlElement.title = src;
  markerControlElement.addEventListener("click", handler);
  controlsElement.appendChild(markerControlElement);
}


  
//ON CLICKING POPUP
document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    if (activeTab.url == undefined) {
      return;
    }
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
  
    const currentVideo = urlParameters.get("v");
  
    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
      //STORAGE FETCHING----------------------------------------------------------
      chrome.storage.local.get([currentVideo+"playbackRate"], (data) => {
        let rate = data[currentVideo+"playbackRate"];
        if (rate == undefined) {
          rate = 1;
        }
        document.getElementById('tempo-value').value = rate;
        document.getElementById('tempo').value = rate;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "changePlaybackRate", rate: rate, videoID: currentVideo});
        });
      });
      chrome.storage.local.get([currentVideo+"markers"], (data) => {
        const currentVideoMarkers = data[currentVideo+"markers"] ? JSON.parse(data[currentVideo+"markers"]) : [];
        viewMarkers(currentVideoMarkers);
      });
      chrome.storage.local.get([currentVideo+"flip"], (data) => {
        
        const flipState = data[currentVideo+"flip"];
        
        document.getElementById('mirror').checked = flipState;
      });
      
      chrome.storage.local.get([currentVideo+"markerStart"], (data) => {
        const markerStart = data[currentVideo+"markerStart"];
        if(markerStart != 0){
          const markerElement = document.getElementById(
            "marker-" + markerStart
          );
          if(markerElement == undefined){
            return;
          }
          markerElement.getElementsByClassName("marker-control:begin")[0].classList.add('highlight');
        }
      });
      chrome.storage.local.get([currentVideo+"markerEnd"], (data) => {
        const markerEnd = data[currentVideo+"markerEnd"];
        if(markerEnd != 0 || markerEnd != undefined){
          const markerElement = document.getElementById(
            "marker-" + markerEnd
          );
          if(markerElement == undefined){
            return;
          }
          markerElement.getElementsByClassName("marker-control:end")[0].classList.add('highlight');
        }
      });
      //BUTTON HANDLING ----------------------------------------------------------
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

      let button = document.getElementById('clear-segments');

      button.addEventListener("click", async (e) => {
        if(e.target.id != "clear-segments"){
          return;
        }
        clearHighlights('marker-control:begin');
        clearHighlights('marker-control:end'); 
        const activeTab = await getActiveTabURL();
        chrome.tabs.sendMessage(activeTab.id, {
          action: "clearMarkers",
        }); 
      });
      button.title = "Clears the selections made for the start and end of the loop";
      //END OF BUTTON HANDLING ----------------------------------------------------------
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "", videoID: currentVideo});
      });
    } else {
      const container = document.getElementsByClassName("wrapper")[0];
      
      container.innerHTML = '<div class="title">This is not detected as a youtube video page.</div>';
    }
  });
  
  
