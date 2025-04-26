import fs from "fs";
import path from "path";
import Jet from "@cch137/jet";
import ytdlCore from "@distube/ytdl-core";
import cp from "child_process";
import ffmpeg from "ffmpeg-static";
import type { Readable, Writable } from "stream";

type YTDLInfo<Full extends boolean = boolean> = {
  id: string;
  title: string;
  url: string;
  author: {
    name: string;
    url: string;
  };
} & (Full extends true
  ? { raw: ytdlCore.videoInfo }
  : Full extends false
  ? {}
  : { raw?: ytdlCore.videoInfo });

type FormatQuality =
  | "lowest"
  | "highest"
  | "highestaudio"
  | "lowestaudio"
  | "highestvideo"
  | "lowestvideo"
  | string
  | number
  | string[]
  | number[];

type FFMpegPreset =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow"
  | "slower"
  | "veryslow"
  | "placebo";

type YTDLOptions = {
  audioQuality?: FormatQuality;
  videoQuality?: FormatQuality;
  audioCodec?: string;
  videoCodec?: string;
  format?: string;
  preset?: FFMpegPreset;
  videoOnly?: boolean;
  audioOnly?: boolean;
  output?: string | Writable;
};

type MP3Options = {
  quality?: FormatQuality;
  codec?: string;
  output?: string | Writable;
};

export class YTDL {
  // https://github.com/fent/node-ytdl-core/blob/master/example/ffmpeg.js
  // https://github.com/fent/node-ytdl-core/blob/cc6720f9387088d6253acc71c8a49000544d4d2a/example/ffmpeg.js

  static get(source: string, output: string | Writable): YTDL;
  static get(source: string, options?: YTDLOptions): YTDL;
  static get(source: string, options?: string | Writable | YTDLOptions) {
    return new YTDL(
      source,
      typeof options === "string" || (options && "on" in options)
        ? { output: options }
        : options
    );
  }

  static mp4(source: string, options?: YTDLOptions) {
    return new YTDL(source, { format: "mp4", ...options });
  }

  static mp3(source: string, options: MP3Options = {}) {
    const { quality: audioQuality, codec: audioCodec, ...o } = options;
    return new YTDL(source, {
      audioOnly: true,
      audioQuality,
      audioCodec,
      ...o,
    });
  }

  static async info<Full extends boolean>(
    source: string
  ): Promise<YTDLInfo<false> | null>;
  static async info<Full extends boolean>(
    source: string,
    full: Full
  ): Promise<YTDLInfo<Full> | null>;
  static async info(source: string, full?: boolean) {
    try {
      const raw = await ytdlCore.getInfo(source);
      const {
        videoDetails: {
          title,
          videoId: id,
          author: { name, channel_url, external_channel_url },
        },
      } = raw;
      return {
        id,
        title,
        url: `https://youtu.be/${id}`,
        author: {
          name,
          url: channel_url || external_channel_url || "",
        },
        raw: full ? raw : undefined,
      };
    } catch {}
    return null;
  }

  readonly progress = {
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    get downloaded() {
      return this.audio.downloaded + this.video.downloaded;
    },
    get total() {
      return this.audio.total + this.video.total;
    },
    get value() {
      return this.downloaded / this.total;
    },
  };

  readonly source: string;
  readonly process?: cp.ChildProcess;
  readonly audio?: Readable;
  readonly video?: Readable;
  private readonly _readable?: Readable;

  get stream(): Readable {
    return this.process?.stdout ?? this._readable!;
  }

  onprogress?: (progress: number) => any;

  private constructor(
    source: string,
    options: {
      audioQuality?: FormatQuality;
      videoQuality?: FormatQuality;
      audioCodec?: string | null;
      videoCodec?: string | null;
      format?: string;
      preset?: FFMpegPreset;
      videoOnly?: boolean;
      audioOnly?: boolean;
      output?: string | Writable;
    } = {}
  ) {
    this.source = source;

    const {
      audioQuality = "highestaudio",
      videoQuality = "highestvideo",
      audioCodec,
      videoCodec = "copy",
      format = "matroska",
      preset = "medium",
      videoOnly = false,
      audioOnly = false,
      output,
    } = options;

    const audio = videoOnly
      ? undefined
      : ytdlCore(source, {
          filter: audioOnly ? "audioonly" : undefined,
          quality: audioQuality,
        }).on("progress", (_, downloaded, total) => {
          this.progress.audio.downloaded = downloaded;
          this.progress.audio.total = total;
        });

    const video = audioOnly
      ? undefined
      : ytdlCore(source, {
          filter: videoOnly ? "videoonly" : undefined,
          quality: videoQuality,
        }).on("progress", (_, downloaded, total) => {
          this.progress.video.downloaded = downloaded;
          this.progress.video.total = total;
        });

    if (audioOnly) this.progress.video.total = 0;
    if (videoOnly) this.progress.audio.total = 0;

    if (!(audio || video))
      throw new Error("`audioOnly` and `videoOnly` cannot both be true");

    const isStreamOutput = typeof output !== "string";

    if (!audio || !video) {
      const readable = (audio || video)!;
      readable.on("data", () => {
        this.onprogress?.(this.progress.value);
      });
      if (isStreamOutput) {
        if (output) readable.pipe(output);
      } else {
        readable.pipe(fs.createWriteStream(output));
      }
      this._readable = readable;
      return this;
    }

    const process = cp.spawn(
      String(ffmpeg),
      [
        // ffmpeg's console spamming
        ["-loglevel", "quiet", "-hide_banner"],
        // redirect / enable progress messages
        ["-progress", "pipe:3"],
        // set inputs
        ["-i", "pipe:4", "-i", "pipe:5"],
        // video codec, default=copy, others: copy (keep encoding), libx264
        videoCodec ? ["-c:v", videoCodec] : [],
        // audio codec, default=undefined, others: copy (keep encoding), aac
        audioCodec ? ["-c:a", audioCodec] : [],
        // encoding speed
        ["-preset", preset],
        // set format, default=matroska, more: mp4,
        ["-f", format],
        // map audio & video from streams
        ["-map", "0:a", "-map", "1:v"],
        // output container, "-" is stream
        isStreamOutput ? "-" : output,
      ].flat(),
      {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe", "pipe", "pipe", "pipe"],
      }
    );

    this.process = process;
    this.audio = audio;
    this.video = video;

    audio.pipe((process.stdio as any)[4]);
    video.pipe((process.stdio as any)[5]);

    (process.stdio as Readable[])[3].on("data", () => {
      this.onprogress?.(this.progress.value);
    });
  }
}

export const router = new Jet.Router();

router.use(Jet.mergeQuery());

function toSafeFilename(value: string) {
  return value.replace(/[\/:*?"<>|\\\x00-\x1F]/g, "_");
}

export function Booleanish(value: any) {
  if (typeof value !== "string") return Boolean(value);
  if (value === "false" || value === "0") return false;
  return true;
}

router.get("/info", async (req, res) => {
  if (!(req.method === "GET" || req.method === "POST"))
    return res.status(200).end();

  const { src: s1, source: s2, id: s3, full: s4 } = req.query;

  const _source = s1 || s2;
  const id = s3;
  const full = Booleanish(s4);

  const source = _source || (id ? `https://youtu.be/${id}` : null);

  if (!source || typeof source !== "string") return res.status(400).end();

  try {
    res.json(await YTDL.info(source, full));
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.use("/download", async (req, res) => {
  if (!(req.method === "GET" || req.method === "POST"))
    return res.status(200).end();

  const { src: s1, source: s2, id: s3, d: s4, f: s5, filename: s6 } = req.query;

  const _source = s1 || s2;
  const id = s3;
  const downloadId = s4;
  let format = s5 || "mp3";
  let filename = String(s6);

  if (downloadId && typeof downloadId === "string") {
    const dirname = `caches/ytdl/${downloadId}/`;

    if (!fs.existsSync(dirname)) {
      res.status(404).end();
      return;
    }

    if (!filename || !fs.existsSync(dirname + filename)) {
      filename = fs.readdirSync(dirname)[0];
      if (!filename) {
        res.status(404).end();
        return;
      }
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader("Content-Type", "video/mp4");

    fs.createReadStream(dirname + filename).pipe(res);

    return;
  }

  const source = _source || (id ? `https://youtu.be/${id}` : null);

  if (!source || typeof source !== "string") return res.status(400).end();

  if (!filename || typeof filename !== "string") {
    const info = await YTDL.info(source);
    if (!info) return res.status(500).end();
    filename = info?.title;
  }

  if (typeof format === "string") format = format.toLowerCase();

  if (!filename.endsWith(`.${format}`)) filename += `.${format}`;
  filename = toSafeFilename(filename);

  if (format === "mp4") {
    try {
      const uuid = crypto.randomUUID();
      const cacheFilepath = `caches/ytdl/${uuid}/${filename}`;
      try {
        fs.mkdirSync(path.dirname(cacheFilepath), { recursive: true });
      } catch {}
      YTDL.mp4(source, { output: cacheFilepath })
        .stream.on("close", () => {
          res.redirect(`/youtube/download?d=${uuid}`);
        })
        .on("error", () => res.status(500).end());
    } catch {
      res.status(500).end();
    }
    return;
  }

  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader("Content-Type", "audio/mpeg");
    YTDL.mp3(source).stream.pipe(res);
  } catch {
    res.status(500).end();
  }
});
