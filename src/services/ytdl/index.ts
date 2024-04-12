import ytdl from "ytdl-core";

export const ytdlGetInfo = async (source: string) => {
  const {
    videoDetails: { title, videoId: id },
  } = await ytdl.getInfo(source);
  return {
    id,
    title,
    api: `/yt-to-mp3/${encodeURIComponent(title)}.mp3?id=${id}`,
  };
};

export const ytdlDownloadMp3 = async (source: string) => {
  return ytdl(source, {
    filter: "audioonly",
    quality: "highestaudio",
  });
};
