chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch (request.action) {
            case "flipVideo":
                flipVideo();
                break;
            case "changeSpeed":
                changeSpeed(request.value);
                break;
        }
    
    }
);

function flipVideo(){
    const video = document.querySelector('video');
    if(video){
        isFlipped = !is
        video.style.transform = video.style.transform === 'scaleX(-1)' ? 'scaleX(1)' : 'scaleX(-1)';
        console.log("video flipped");
    }
}
function changeSpeed(value){
    const video = document.querySelector('video');
    if(video){
        video.playbackRate = value;
        console.log("video speed changed");
    }
}