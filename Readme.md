# Youtube Information Parser
[![DeepScan grade](https://deepscan.io/api/teams/10967/projects/13904/branches/246156/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=10967&pid=13904&bid=246156)
[![npm](https://img.shields.io/npm/v/youtube-information-parser)](https://www.npmjs.com/package/youtube-information-parser)

This module allows you to retrieve information about title, creator, clicks, thumbnails and raw video urls of any youtube video you want!

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

When you only need the ```StreamingInfo``` which contains the video of the highest quality, execute the ```getBestQualityStreamingInfo(filters?: Filter): Promise<StreamingInfo>``` function. This will return the ```StreamingInfo``` with the highest video dimensions. To retrieve only videos which match specific attributes, like ```audio: true```, specify them in the optional filters parameter. The parameter is of type ```[FilterType, keyof StreamingInfo, any][]``` which means, that you can provide an array of 3-tuples. The first element of the tuple represents the comparison type (e.g. ==, <=, >=, ...), the second the key you want to check (e.g. ```"audio"```) and the last element represents the value of the key (e.g. ```true```). To retrieve the video with the highest quality which contains audio, you would call:
 ```TypeScript
 getBestQualityStreamingInfo([[FilterType.EQUAL, "audio", true]])
 ```
To filter for a set of ```StreamingInfo```, that match your filter conditions, use the ```getFilteredStreamingInfo(filters: Filter): Promise<StreamingInfo[]>``` function.
### Download videos
To download a youtube video, the easiest way to do so is to create a new instance of the ```YoutubeDownloader``` class. Provide the URL of the youtube video and the download location (relative Path with filename) as parameters in the constructor. After that execute the ```downloadBestQuality(): Promise<string>``` to download the video with the highest video quality. You can otherwise search for a ```StreamingInfo``` and download the video with the specific ```StreamingInfo```.
## Contribution
This project is work in progress. Feel free to create pull requests or report bugs using the github issue tracker!
