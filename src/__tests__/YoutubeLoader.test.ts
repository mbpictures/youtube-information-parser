import { YoutubeLoader, VideoInfo, FilterType, StreamingInfo } from '../YoutubeLoader';

test('video_id1', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=jdskfjl_ajs');
    expect(yt.videoId).toBe('jdskfjl_ajs');
});

test('video_id2', () => {
    let yt: YoutubeLoader = new YoutubeLoader('http://youtu.be/jdskfjl_ajs');
    expect(yt.videoId).toBe('jdskfjl_ajs');
});

test('video_id_fail', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=');
    expect(() => {
        yt.videoId;
    }).toThrow(YoutubeLoader.VIDEO_ID_NOT_FOUND_ERROR);
});

test('video_links', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=ahCwqrYpIuM');
    yt.getVideoLinks().then((value: VideoInfo) => {
        expect(value.title).toBe('TypeScript - The Basics');
        expect(value.creator).toBe('Fireship');
    });
});

test('video_links_fail', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=abcdefghijk');
    expect(yt.getVideoLinks()).rejects.toEqual(YoutubeLoader.VIDEO_NOT_FOUND_ERROR);
});

test('streaming_info_filter1', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=ahCwqrYpIuM');
    yt.getFilteredStreamingInfo([[FilterType.EQUAL, 'audio', false]]).then((infos: StreamingInfo[]) => {
        infos.forEach((info: StreamingInfo) => {
            expect(info.audio).toBe(false);
        });
    });
});

test('streaming_info_filter2', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=ahCwqrYpIuM');
    yt.getFilteredStreamingInfo([[FilterType.GREATER_OR_EQUAL_THAN, 'width', 720]]).then((infos: StreamingInfo[]) => {
        infos.forEach((info: StreamingInfo) => {
            expect(info.width).toBeGreaterThanOrEqual(720);
        });
    });
});
