import fs from "fs";
import path from "path";
import Jet from "@cch137/jet";
import YTDL from "@cch137/ytdl";

export const router = new Jet.Router();

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

  const { src: s1, source: s2, id: s3, full: s4 } = Jet.getParams(req);

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

  const {
    src: s1,
    source: s2,
    id: s3,
    d: s4,
    f: s5,
    filename: s6,
  } = Jet.getParams(req);

  const _source = s1 || s2;
  const id = s3;
  const downloadId = s4;
  let format = s5 || "mp3";
  let filename = s6;

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
