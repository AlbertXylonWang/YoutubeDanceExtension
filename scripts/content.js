(() => {
  let youtubeRightControls, youtubePlayer;
  var flipState;
  var currentVideo = "";
  let currentVideoMarkers = [];
  let markerStart = 0;
  let markerEnd = 0;
  let intervalId;
  var playbackR = 1;


  // FLIP VIDEO ----------------------------------------------------------------------
  function flipVideo() {
    const video = document.querySelector('video');
    if (video) {
       console.log("currentVideo: "+currentVideo);
        const newState = !flipState;
        flipState = newState;
        applyFlip(video);
        chrome.storage.local.set({
            [currentVideo+"flip"]: flipState
          });
    }
}
function applyFlip(video){

  video.style.transform = flipState ? 'scaleX(-1)' : 'scaleX(1)';

}
const fetchFlipState = () => {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get([currentVideo + "flip"], (result) => {
          if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
          } else {
              resolve(result[currentVideo + "flip"]);
          }
      });
  });
};


const observer = new MutationObserver(mutations => {
  
  mutations.forEach(mutation => {
      if (mutation.target.tagName === 'VIDEO') {
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
      console.log("observer started");
      observer.observe(document.body, observerConfig);
      applyFlip(video);
  }
}

function stopObserver() {
  console.log("observer stopped");
  observer.disconnect();
}

//Tempo ---------------------------------------------------------------



const fetchPlaybackRate = () => {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get([currentVideo + "playbackRate"], (result) => {
          if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
          } else {
              resolve(result[currentVideo + "playbackRate"] || 1);
          }
      });
  });
};

function changePlaybackRate(rate){
  playbackR = rate;

  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = rate;
  }

  chrome.storage.local.set({
    [currentVideo+"playbackRate"]: rate
  });
}
// Markers ----------------------------------------------------------------------

const addNewMarkerEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newMarker = {
      time: currentTime,
      desc: "Marker at " + getTime(currentTime),
    };

    currentVideoMarkers = await fetchMarkers();
    console.log('BUTTON DETECTED');
    // chrome.storage.local.set({
    //   [currentVideo+"markers"]: JSON.stringify([...currentVideoMarkers, newMarker].sort((a, b) => a.time - b.time))
    // });
  };


  const fetchMarkers = async () => {
    const markers = await chrome.storage.local.get(currentVideo+"markers");
    return JSON.parse(markers[currentVideo+"markers"]);
  };
  
// LOOP SEGMENT ----------------------------------------------------------------



// ON LOAD----------------------------------------------------------------------
const newVideoLoaded = async () => {
    
    const markerBtnExists = document.getElementsByClassName("ytp-button marker-btn")[0];
    //  currentVideoMarkers = await fetchMarkers();
    flipState = await fetchFlipState();
    playbackR = await fetchPlaybackRate();
    console.log("new video loaded running\nflipState: "+flipState+"\nplaybackRate: "+playbackR+"\n")
    applyFlip(document.querySelector('video'));

    console.log('stored properties applied');
    if (!markerBtnExists) {
      const markerBtn = document.createElement("img");

      markerBtn.src = chrome.runtime.getURL("assets/marker.png");
      markerBtn.className = "ytp-button " + "marker-btn";
      markerBtn.title = "Click to mark the current timestamp";

      console.log('marker button created');
      youtubeRightControls = document.getElementsByClassName("ytp-right-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeRightControls.prepend(youtubeRightControls.firstChild, markerBtn);
      markerBtn.addEventListener("click", addNewMarkerEventHandler);
    }

    
  };



// Listen for messages from either the popup or background script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(currentVideo == ""){
        //forces loading operations if the background script doesn't detect it
        currentVideo = request.videoID;
        newVideoLoaded();
        startObserver();
      }
      console.log("message received: " + request.action);
        if (request.action === "flipVideo") {
            flipVideo();
        }else if(request.action === "changePlaybackRate"){
          changePlaybackRate(request.rate);
        
      } else if(request.action === "NEW_VIDEO"){
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
    console.log("page unloaded");
    stopObserver();
});
})();