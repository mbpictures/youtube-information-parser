# Youtube Information Parser
[![npm](https://img.shields.io/npm/v/youtube-information-parser)](https://www.npmjs.com/package/youtube-information-parser)

This module allows you to retrieve fast information about title, creator, clicks, thumbnails and raw video urls of any youtube video you want!

## Installation
To install this module, simply run the following command:
```
npm install --save youtube-url-parser
```

## Usage
The first thing you have to do is to import it:
```TypeScript
import * from "youtube-url-parser";
```

After that, you can create a new ```YoutubeLoader``` object like this:
```TypeScript
let loader: YoutubeLoader = new YoutubeLoader("https://youtube.com/watch?v=VIDEO_ID");
```
Execute the ```getVideoLinks()``` function to retrieve all information about the video. This function returns a promise, which means you can either use the ```.then(...)``` and ```.catch(...)``` functions or prefix the function call with a ```await``` statement to handle asynchronous behavior.

When you only need the ```StreamingInfo``` which contains the video of the highest quality, execute the ```getBestQualityStreamingInfo(filters?: Filter)``` function. This will return the ```StreamingInfo``` with the highest video dimensions. To retrieve only videos which match specific attributes, like ```audio: true```, specify them in the optional filters parameter. The parameter is of type ```[keyof StreamingInfo, any][]``` which means, that you can provide an array of tupels. The first element of the tupel represents the key you want to check (e.g. ```"audio"```) and the second element represents the value of the key (e.g. ```true```). To retrieve the video with the highest quality which contains audio, you would call:
 ```TypeScript
 getBestQualityStreamingInfo([["audio", true]])
 ```

## Contribution
This project is work in progress. Feel free to create pull requests or report bugs using the github issue tracker!