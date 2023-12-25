(() => {
let youtubeLeftControls, youtubePlayer;
let flipState;
let currentVideo = "";
let currentVideoMarkers = [];
let markerStart = 0;
let markerEnd = 0;
let intervalId;

// FLIP VIDEO ----------------------------------------------------------------------
function flipVideo() {
    const video = document.querySelector('video');
    if (video) {
       
        const newState = !flipState;
        flipState = newState;
        applyFlip(video);
        chrome.storage.sync.set({
            [currentVideo+"flip"]: flipState
          });
    }
}
function applyFlip(video){
    if(flipState){
        video.style.transform = 'scaleX(-1)';
    }else{
        video.style.transform = 'scaleX(1)';
    }
}
const fetchFlipState = async () => {
  const flipState = await chrome.storage.sync.get(currentVideo+"flip");
  return flipState[currentVideo+"flip"];
};

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
      if (mutation.target.nodeName === 'video') {
          applyFlip(mutation.target);
      }
  });
});

const observerConfig = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style']

  
};

function startObserver() {
  const video = document.querySelector('video');
  if (video) {
      observer.observe(document.body, observerConfig);
      applyFlip(video);
  }
}

function stopObserver() {
  observer.disconnect();
}

//Tempo ---------------------------------------------------------------

// Markers ----------------------------------------------------------------------

const addNewMarkerEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newMarker = {
      time: currentTime,
      desc: "Marker at " + getTime(currentTime),
    };

    currentVideoMarkers = await fetchMarkers();

    chrome.storage.sync.set({
      [currentVideo+"markers"]: JSON.stringify([...currentVideoMarkers, newMarker].sort((a, b) => a.time - b.time))
    });
  };


  const fetchMarkers = async () => {
    const markers = await chrome.storage.sync.get(currentVideo+"markers");
    return JSON.parse(markers[currentVideo+"markers"]);
  };
  
// LOOP SEGMENT ----------------------------------------------------------------



// ON LOAD----------------------------------------------------------------------
const newVideoLoaded = async () => {
    
    const markerBtnExists = document.getElementsByClassName("marker-btn")[0];

    currentVideoMarkers = await fetchMarkers();
    flipState = await fetchFlipState();
    if (!markerBtnExists) {
      const markerBtn = document.createElement("img");

      markerBtn.src = chrome.runtime.getURL("assets/marker.png");
      markerBtn.className = "ytp-button " + "marker-btn";
      markerBtn.title = "Click to mark the current timestamp";

      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeLeftControls.appendChild(markerBtn);
      markerBtn.addEventListener("click", addNewMarkerEventHandler);
    }

    
  };



// Listen for messages from either the popup or background script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "flipVideo") {
            flipVideo();
        }else if(request.action === "NEW_VIDEO"){
            currentVideo = request.videoId;
            newVideoLoaded();
            startObserver();
        }
    }
);

// Clear the interval when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (intervalId) {
        clearInterval(intervalId);
    }
    stopObserver();
});

})();