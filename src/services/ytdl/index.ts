import fs from "fs";
import path from "path";
import Jet from "@cch137/jet";
import YTDL from "@cch137/ytdl";

export const router = new Jet.Router();

function toSafeFilename(value: string) {
  return value.replace(/[\/:*?"<>|\\\x00-\x1F]/g, "_");
}

router.get("/info", async (req, res) => {
  if (!(req.method === "GET" || req.method === "POST"))
    return res.status(200).end();

  const _source =
    req._url.searchParams.get("src") ||
    req.body?.["src"] ||
    req._url.searchParams.get("source") ||
    req.body?.["source"];
  const id = req._url.searchParams.get("id") || req.body?.["id"];

  const source = _source || (id ? `https://youtu.be/${id}` : null);

  if (!source || typeof source !== "string") return res.status(400).end();

  try {
    return res.json(await YTDL.info(source));
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.use("/download", async (req, res) => {
  if (!(req.method === "GET" || req.method === "POST"))
    return res.status(200).end();

  const _source =
    req._url.searchParams.get("src") ||
    req.body?.["src"] ||
    req._url.searchParams.get("source") ||
    req.body?.["source"];
  const id = req._url.searchParams.get("id") || req.body?.["id"];
  const downloadId = req._url.searchParams.get("d") || req.body?.["d"];
  let format = req._url.searchParams.get("f") || req.body?.["f"] || "mp3";
  let filename =
    req._url.searchParams.get("filename") || req.body?.["filename"];

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
