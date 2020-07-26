import * as request from 'request';

export class YoutubeLoader {
    private _url: string;
    static readonly VIDEO_ID_NOT_FOUND_ERROR = 'No Video ID found!';
    static readonly VIDEO_NOT_FOUND_ERROR = 'Video not found or unavailable!';

    private cachedVideoInfo: VideoInfo | undefined;

    constructor(url: string) {
        this._url = url;
    }

    get url(): string {
        return this._url;
    }

    set url(url: string) {
        this._url = url;
        this.cachedVideoInfo = undefined;
    }

    async getVideoLinks(): Promise<VideoInfo> {
        const url: string = `https://www.youtube.com/get_video_info?html5=1&video_id=${this.getVideoId()}`;

        return new Promise<VideoInfo>((resolve, reject) => {
            if(this.cachedVideoInfo !== undefined) {
                resolve(this.cachedVideoInfo);
                return;
            }
            request(url, undefined, (err, res, body) => {
                if (err || res.statusCode < 200 || res.statusCode >= 300) {
                    reject(`HTTP ${res.statusCode}: ${err}`);
                    return;
                }

                const plainVideoInfo = this.parseVideoInfo(body);
                if (
                    plainVideoInfo.player_response.playabilityStatus.status &&
                    plainVideoInfo.player_response.playabilityStatus.status === 'ERROR'
                ) {
                    reject(YoutubeLoader.VIDEO_NOT_FOUND_ERROR);
                    return;
                }

                const videoInfo: VideoInfo = {
                    title: plainVideoInfo.player_response.videoDetails.title ?? '',
                    keywords: plainVideoInfo.player_response.videoDetails.keywords ?? [],
                    thumbnails: plainVideoInfo.player_response.videoDetails.thumbnail.thumbnails ?? [],
                    views: parseInt(plainVideoInfo.player_response.videoDetails.viewCount, 10) ?? 0,
                    creator: plainVideoInfo.player_response.videoDetails.author ?? '',
                    streamingData: [],
                };

                plainVideoInfo.player_response.streamingData.formats
                    .concat(plainVideoInfo.player_response.streamingData.adaptiveFormats)
                    .forEach((val: any) => {
                        videoInfo.streamingData.push({
                            itag: val.itag ?? 0,
                            url: val.url ?? '',
                            width: val.width ?? 0,
                            height: val.height ?? 0,
                            quality: val.quality ?? 'low',
                            qualityLabel: val.qualityLabel ?? '320p',
                            audio: 'audioChannels' in val && val.audioChannels > 0,
                            fps: val.fps ?? 0,
                        });
                    });

                this.cachedVideoInfo = videoInfo;

                resolve(videoInfo);
            });
        });
    }

    async getBestQualityStreamingInfo(filters?: Filter): Promise<StreamingInfo> {
        return new Promise<StreamingInfo>(async (resolve, reject) => {
            if (this.cachedVideoInfo !== undefined) {
                resolve(this.findBestQualityStreamingInfo(this.cachedVideoInfo, filters));
                return;
            }
            this.getVideoLinks()
                .then((info: VideoInfo) => {
                    this.cachedVideoInfo = info;
                    resolve(this.findBestQualityStreamingInfo(info, filters));
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }

    private findBestQualityStreamingInfo(info: VideoInfo, filters?: Filter): StreamingInfo {
        let currentInfo = info.streamingData[0];
        info.streamingData.forEach((val: StreamingInfo) => {
            let override: boolean = val.height > currentInfo.height && val.width > currentInfo.width;
            if (!override) return;

            filters?.forEach((filter: [keyof StreamingInfo, any]) => {
                override = override && val[filter[0]] === filter[1];
            });
            if (override) currentInfo = val;
        });

        return currentInfo;
    }

    private parseVideoInfo(plain: string): { [key: string]: any } {
        const res: { [key: string]: any } = {};
        const pars = plain.split('&');
        pars.forEach((value: string) => {
            const kv = value.split('=');
            const k = this.decodeUrlFormat(kv[0]);
            let v = this.decodeUrlFormat(kv[1]);
            v = this.isJson(v) ? JSON.parse(v) : v;
            res[k] = v;
        });
        return res;
    }

    private isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    private decodeUrlFormat(str: string): string {
        return decodeURIComponent(str.split('+').join(' '));
    }

    getVideoId(): string {
        const result = this._url.match(/[a-z0-9_-]{11}/i);
        if (result && result.length > 0) {
            return result[0];
        }
        throw new Error(YoutubeLoader.VIDEO_ID_NOT_FOUND_ERROR);
    }
}

export interface VideoInfo {
    title: string;
    keywords: string[];
    thumbnails: Thumbnail[];
    views: number;
    creator: string;
    streamingData: StreamingInfo[];
}

export interface Thumbnail {
    url: string;
    height: number;
    width: number;
}

export interface StreamingInfo {
    itag: number;
    url: string;
    width: number;
    height: number;
    quality: string;
    qualityLabel: string;
    fps: number;
    audio: boolean;
}

export type Filter = [keyof StreamingInfo, any][];
