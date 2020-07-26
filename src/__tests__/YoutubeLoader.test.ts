import { YoutubeLoader, VideoInfo } from '../YoutubeLoader';

test('video_id', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=jdskfjl_ajs');
    expect(yt.getVideoId()).toBe('jdskfjl_ajs');
});

test('video_id_fail', () => {
    let yt: YoutubeLoader = new YoutubeLoader('https://www.youtube.com/watch?v=');
    expect(() => {
        yt.getVideoId();
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
