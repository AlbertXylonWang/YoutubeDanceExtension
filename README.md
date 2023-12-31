# Youtube Dance Extension

Created by Albert Xylon Wang. Winter 2023 Personal Project

Youtube Dance Extension (YDE) is chrome extension made to assist dancers who practice through youtube videos.
This is achieved by helping them alter video properties in the following ways:
- video mirroring
- speed control
- segmentation and looping

This extension can be found on the chrome extension store or by downloading the files and loading them as unpacked.

![extension screenshot](https://github.com/AlbertXylonWang/YoutubeDanceExtension/assets/89566740/7b430c81-9091-4a31-8282-fb8841176b6f)

# Feature Descriptions
### Mirroring

Mirroring will transform the player horizontally.

### Speed Control

Speed Control will set the playback rate of the youtube video player.

### Segmentation and Looping
This is the most complex feature here. What this does is it inserts a button into the youtube player that allows the user to create markers at specific time stamps. These markers then appear on the extension popup with the ability to set them as starting and end points. After these points are set the extension checks on a 1 second time interval if the youtube player current time is beyond the interval.

These features are saved locally per video and can be restored when reloading the page.
# How It's Made and File Structure:
Tech used: HTML, CSS, JavaScript
Assets holds the images used for the markers.
Icons holds the images used for displaying the extension itself.
On load, chrome injects content.js into the webpage. This script is responsible for monitoring the video status and properly applying attributes as desired.
The popup interfaces with content through local chrome storage and chrome tabs messages and is what allows the user to control the player with the exception of marker creation.

# Contact
- Albert Wang: AlbertXylonWang@gmail.com
- Project Repo: https://github.com/AlbertXylonWang/YoutubeDanceExtension/
- Live: https://chromewebstore.google.com/detail/dance-practice-assist-for/ldlapkanohjmjepklnhnohdhofbnnfih?hl=en

# Acknowledgements
- Raman Hundal's Build a Chrome Extension on freecodecamp
- icons8.com for the icons
