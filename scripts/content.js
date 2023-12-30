(() => {
  let youtubeRightControls, youtubePlayer;
  let flipState;
  let currentVideo = "";
  let currentVideoMarkers = [];
  let markerStart = 0;
  let markerEnd = 0;
  let intervalId;
  let playbackR = 1;
  let currentSrc = "";



  // FLIP VIDEO ----------------------------------------------------------------------
  function flipVideo() {
    const video = document.querySelector('video');
    if (video) {
        const newState = !flipState;
        flipState = newState;
        applyFlip(video);
        chrome.storage.local.set({
            [currentVideo+"flip"]: flipState
          });
    }
}
function applyFlip(video){
  if(video == undefined) return;
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

const clearFlipState = (video) => {
  video.style.transform = 'scaleX(1)';
}
const observer = new MutationObserver(mutations => {
  
  mutations.forEach(mutation => {
    
    if(mutation.target.src != undefined && mutation.target.src != currentSrc){
      clearFlipState(mutation.target);
      clearInterval(intervalId);
      clearMarkerEnd();
      clearMarkerStart();
      flipState = false;
      stopObserver();
      currentVideo = "";
    }else if (mutation.type === 'attributes' && mutation.attributeName === 'style' ) {
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
      observer.observe(document.getElementsByClassName("video-stream")[0], observerConfig);
      if(video.src != ""){
        currentSrc = video.src;
      }
  }
}

function stopObserver() {
  if(!observer) return;
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
  if(currentVideo == ""){
    alert("Current Video not found:\nPlease click the extension icon again or refresh the page");
    return;
  }
  currentVideoMarkers = await fetchMarkers();
  if(currentVideoMarkers.length >= 5){
    alert("You can only have 6 markers per video");
    return;
  }
    const currentTime = youtubePlayer.currentTime;
    const newMarker = {
      time: currentTime,
      desc: "Marker at " + getTime(currentTime),
    };

    currentVideoMarkers = await fetchMarkers();
    chrome.storage.local.set({
      [currentVideo+"markers"]: JSON.stringify([...currentVideoMarkers, newMarker].sort((a, b) => a.time - b.time))
    });
  };


  const fetchMarkers = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([currentVideo+"markers"], (obj) => {
        resolve(obj[currentVideo+"markers"] ? JSON.parse(obj[currentVideo+"markers"]) : []);
      });
    });
  };
  
  const fetchMarkerStart = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([currentVideo+"markerStart"], (obj) => {
        resolve(obj[currentVideo+"markerStart"] ? obj[currentVideo+"markerStart"] : 0);
      });
    });
  };
  const fetchMarkerEnd = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([currentVideo+"markerEnd"], (obj) => {
        resolve(obj[currentVideo+"markerEnd"] ? obj[currentVideo+"markerEnd"] : 0);
      }
      );
    });
  };
  function clearMarkerStart(){
    markerStart = -1;
    chrome.storage.local.remove([currentVideo+"markerStart"]);
  }
  function clearMarkerEnd(){
    markerEnd = -1;
    chrome.storage.local.remove([currentVideo+"markerEnd"]);
  }
// LOOP SEGMENT ----------------------------------------------------------------

function checkLoop(){
  if(markerStart != -1 && markerEnd != -1){
    clearInterval(intervalId);
    intervalId = setInterval(loop, 1000);
  }
}
function loop(){
  if(markerEnd > youtubePlayer.duration){
    clearInterval(intervalId);
    clearMarkerEnd();
    clearMarkerStart();
  }
  if( (youtubePlayer.currentTime >= markerEnd && markerEnd != -1 )|| youtubePlayer.currentTime < markerStart){
    youtubePlayer.currentTime = markerStart;
  }

}

// ON LOAD----------------------------------------------------------------------
const newVideoLoaded = async () => {
    clearMarkerEnd();
    clearMarkerStart();
    const markerBtnExists = document.getElementsByClassName("ytp-button marker-btn")[0];
    
    currentVideoMarkers = await fetchMarkers();
    flipState = await fetchFlipState();
    playbackR = await fetchPlaybackRate();
    markerEnd = await fetchMarkerEnd();
    markerStart = await fetchMarkerStart();
    applyFlip(document.querySelector('video'));
    changePlaybackRate(playbackR);
    
    if (!markerBtnExists) {
      const markerBtn = document.createElement("img");

      markerBtn.src = chrome.runtime.getURL("assets/icons8-crayon-48.png");
      markerBtn.className = "ytp-button " + "marker-btn";
      markerBtn.title = "Click to mark the current timestamp";
      markerBtn.onmouseover = function () {
        markerBtn.style.opacity = "0.5";
      };
      markerBtn.onmouseout = function () {
        markerBtn.style.opacity = "1";
      };
      markerBtn.style.opacity = "1";
      markerBtn.style.cursor = "pointer";
      markerBtn.onmousedown = function () {
        markerBtn.style.scale = "0.8";
      };
      markerBtn.onmouseup = function () {
        markerBtn.style.scale = "1";
      };
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
        //loads video properties
        currentVideo = request.videoID;
        newVideoLoaded();
        startObserver();
      }
        if (request.action === "flipVideo") {
            flipVideo();
        }else if(request.action === "changePlaybackRate"){
          changePlaybackRate(request.rate);
        }else if(request.action === "deleteMarker"){
      
          currentVideoMarkers = currentVideoMarkers.filter((b) => b.time != request.time);
          if(markerStart != undefined && markerStart == request.time){
            clearMarkerStart();
          }
          if(markerEnd != undefined && markerEnd == request.time){
            clearMarkerEnd();
          }
          chrome.storage.local.set({ [currentVideo+"markers"]: JSON.stringify(currentVideoMarkers) });
          response(currentVideoMarkers)
        }else if(request.action === "setMarkerStart"){
          markerStart = request.time;

          checkLoop();

          chrome.storage.local.set({
            [currentVideo+"markerStart"]: markerStart
          });
        }else if(request.action === "setMarkerEnd"){
          markerEnd = request.time;
          checkLoop();
          
          chrome.storage.local.set({
            [currentVideo+"markerEnd"]: markerEnd
          });
        }else if(request.action === "clearMarkers"){
          markerStart = 0;
          markerEnd = 0;
          clearInterval(intervalId);
          chrome.storage.local.remove([currentVideo+"markerStart"]);
          chrome.storage.local.remove([currentVideo+"markerEnd"]);
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

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};