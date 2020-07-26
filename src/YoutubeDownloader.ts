import { StreamingInfo, YoutubeLoader } from "./YoutubeLoader";
import request = require("request");
import fs = require("fs");

export class YoutubeDownloader {
    static readonly FILE_ERROR = "File error!";
    static readonly DOWNLOAD_ERROR = "Download error!";
    private _loader: YoutubeLoader;
    private _downloadPath: string;

    constructor(url: string, downloadPath: string) {
        this._loader = new YoutubeLoader(url);
        this._downloadPath = downloadPath;
    }

    get downloadPath(): string {
        return this._downloadPath;
    }

    set downloadPath(downloadPath: string) {
        this._downloadPath = downloadPath;
    }

    get youtubeLoader(): YoutubeLoader {
        return this._loader;
    }

    set youtubeLoader(loader: YoutubeLoader) {
        this._loader = loader;
    }

    downloadVideo(streamInfo: StreamingInfo): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let file = fs.createWriteStream(this.downloadPath);
            let req = request(streamInfo.url);

            req.on("response", (response) => {
                if(response.statusCode < 200 || response.statusCode >= 300) {
                    reject(`HTTP ${response.statusCode} ERROR`);
                    return;
                }

                req.pipe(file);
            });

            req.on("error", (err) => {
                fs.unlink(this.downloadPath, () => reject(YoutubeDownloader.DOWNLOAD_ERROR));
            });

            file.on("finish", () => {
                file.close();
                resolve(this.downloadPath);
            });

            file.on("error", (err) => {
                fs.unlink(this.downloadPath, () => reject(err));
            });
        });
    }

    async downloadVideoAtIndex(index: number): Promise<string> {
        let info: StreamingInfo = (await this.youtubeLoader.getVideoLinks()).streamingData[index];
        return this.downloadVideo(info);
    }

    async downloadBestQuality(): Promise<string> {
        let info: StreamingInfo = (await this.youtubeLoader.getBestQualityStreamingInfo());
        return this.downloadVideo(info);
    }
}