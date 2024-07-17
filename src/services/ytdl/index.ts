import ytdl from "@distube/ytdl-core";
// @distube/ytdl-core 是 ytdl-core 的分支並且提供更穩定的功能，ytdl-core 似乎已經停止更新了。

export type InfoSummary = {
  id: string;
  title: string;
  url: string;
  author: AuthorSummary;
};

export type AuthorSummary = {
  name: string;
  url: string;
};

export const ytdlGetInfo = async (source: string): Promise<InfoSummary> => {
  const {
    videoDetails: { title, videoId: id, author },
  } = await ytdl.getInfo(source);
  const { name, channel_url, external_channel_url } = author;
  return {
    id,
    title,
    url: `https://youtu.be/${id}`,
    author: {
      name,
      url: channel_url || external_channel_url || "",
    },
  };
};

export const ytdlGetMp3Info = async (source: string) => {
  const { title, id } = await ytdlGetInfo(source);
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
