import * as request from 'request';

export class YoutubeLoader {
    private _url: string;
    static readonly VIDEO_ID_NOT_FOUND_ERROR = 'No Video ID found!';
    static readonly VIDEO_NOT_FOUND_ERROR = 'Video not found or unavailable!';
    static readonly VIDEO_NOT_PLAYABLE = "Video not playable!";

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

    set videoId(id: string) {
        this.url = `https://youtube.com/watch?v=${id}`;
    }

    get videoId(): string {
        const result = this._url.match(/[a-z0-9_-]{11}/i);
        if (result && result.length > 0) {
            return result[0];
        }
        throw new Error(YoutubeLoader.VIDEO_ID_NOT_FOUND_ERROR);
    }

    /**
     * This function retrieves the information of the specified video url.
     * Warning: This function causes an HTTP call, when the video wasn't cached.
     * @returns     Promise containing video information of type ```VideoInfo```
     */
    async getVideoLinks(): Promise<VideoInfo> {
        const url: string = `https://www.youtube.com/get_video_info?html5=1&video_id=${this.videoId}`;

        return new Promise<VideoInfo>((resolve, reject) => {
            if (this.cachedVideoInfo !== undefined) {
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
                    plainVideoInfo.player_response.playabilityStatus.status !== 'OK'
                ) {
                    reject(plainVideoInfo.player_response.playabilityStatus.status === "UNPLAYABLE" ? YoutubeLoader.VIDEO_NOT_PLAYABLE : YoutubeLoader.VIDEO_NOT_FOUND_ERROR);
                    return;
                }

                const videoInfo: VideoInfo = {
                    title: plainVideoInfo.player_response.videoDetails.title ?? '',
                    keywords: plainVideoInfo.player_response.videoDetails.keywords ?? [],
                    thumbnails: plainVideoInfo.player_response.videoDetails.thumbnail.thumbnails ?? [],
                    views: parseInt(plainVideoInfo.player_response.videoDetails.viewCount, 10) ?? 0,
                    creator: plainVideoInfo.player_response.videoDetails.author ?? '',
                    shortDescription: plainVideoInfo.player_response.videoDetails.shortDescription ?? '',
                    streamingData: [],
                };

                const formats = plainVideoInfo.player_response.streamingData.formats ?? [];
                formats.concat(plainVideoInfo.player_response.streamingData.adaptiveFormats).forEach((val: any) => {
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

    /**
     * Retrieve the StreamingInfo with the highest resolution.
     * Warning: This function causes an HTTP call, when the video wasn't cached.
     * @param filters   Filters. Format: [Type, KeyToCheck, ValueToCompareWith][]
     */
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

    /**
     * Retrieve the filtered StreamingInfo of the provided youtube URL.
     * Warning: This function causes an HTTP call, when the video wasn't cached.
     */
    async getFilteredStreamingInfo(filter: Filter): Promise<StreamingInfo[]> {
        return new Promise<StreamingInfo[]>(async (resolve, reject) => {
            if (this.cachedVideoInfo !== undefined) {
                resolve(this.filterStreamingInfo(this.cachedVideoInfo, filter));
                return;
            }
            this.getVideoLinks()
                .then((info: VideoInfo) => {
                    resolve(this.filterStreamingInfo(info, filter));
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }

    /**
     * Filter the StreamingInfo of the VideoInformation to match the given Filters.
     * @param info      VideoInfo which contains the StreamingInfo to filter
     * @param filters   Filters. Format: [Type, KeyToCheck, ValueToCompareWith][]
     */
    filterStreamingInfo(info: VideoInfo, filters?: Filter): StreamingInfo[] {
        const currentInfo: StreamingInfo[] = [];
        info.streamingData.forEach((val: StreamingInfo) => {
            let override: boolean = true;
            filters?.forEach((filter: [FilterType, keyof StreamingInfo, any]) => {
                let localOverride: boolean;
                switch (filter[0]) {
                    case FilterType.EQUAL:
                        localOverride = val[filter[1]] === filter[2];
                        break;
                    case FilterType.UNEQUAL:
                        localOverride = val[filter[1]] !== filter[2];
                        break;
                    case FilterType.LESS_THAN:
                        localOverride = val[filter[1]] < filter[2];
                        break;
                    case FilterType.GREATER_THAN:
                        localOverride = val[filter[1]] > filter[2];
                        break;
                    case FilterType.LESS_OR_EQUAL_THAN:
                        localOverride = val[filter[1]] <= filter[2];
                        break;
                    case FilterType.GREATER_OR_EQUAL_THAN:
                        localOverride = val[filter[1]] >= filter[2];
                        break;
                }
                override = override && localOverride;
            });
            if (override) currentInfo.push(val);
        });
        return currentInfo;
    }

    private findBestQualityStreamingInfo(info: VideoInfo, filters?: Filter): StreamingInfo {
        const filteredStreamingInfo = this.filterStreamingInfo(info, filters);
        let currentInfo: StreamingInfo = filteredStreamingInfo[0];
        filteredStreamingInfo.forEach((val: StreamingInfo) => {
            currentInfo = currentInfo.height < val.height && currentInfo.width < val.width ? val : currentInfo;
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
}

/**
 * Available Video Information.
 */
export interface VideoInfo {
    /** Title of the video. */
    title: string;
    /** Keywords to categorize the video. */
    keywords: string[];
    /** Thumbnails in multiple resolutions */
    thumbnails: Thumbnail[];
    /** Amount of clicks */
    views: number;
    /** Creator of the video */
    creator: string;
    /** Available direct video urls. {@type StreamingInfo} */
    streamingData: StreamingInfo[];
    /** Short description of the video */
    shortDescription: string;
}

/** Thumbnail */
export interface Thumbnail {
    /** Thumbnail URL */
    url: string;
    /** Thumbnail height */
    height: number;
    /** Thumbnail width */
    width: number;
}

export interface StreamingInfo {
    /** format ID */
    itag: number;
    /** Video url */
    url: string;
    /** video width */
    width: number;
    /** video height */
    height: number;
    /** quality of the video */
    quality: string;
    /** displayed quality of the video */
    qualityLabel: string;
    /** fps of the video */
    fps: number;
    /** true when the video contains audio */
    audio: boolean;
}

export enum FilterType {
    /** == */
    EQUAL,
    /** != */
    UNEQUAL,
    /** < */
    LESS_THAN,
    /** > */
    GREATER_THAN,
    /** <= */
    LESS_OR_EQUAL_THAN,
    /** >= */
    GREATER_OR_EQUAL_THAN,
}

export type Filter = [FilterType, keyof StreamingInfo, any][];
