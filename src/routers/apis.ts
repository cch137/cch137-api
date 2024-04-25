import path from "path";
import fs from "fs";
import express from "express";
import parseForm from "../utils/parseForm";

const apis = express.Router();

apis.use("/", express.static("public/"));

apis.get("/", (req, res) => {
  res.send({ t: Date.now() });
});

apis.post("/wakeup", (req, res) => {
  res.send("OK");
});

const started = Date.now();
apis.get("/started", (req, res) => {
  res.send({ t: started });
});

apis.get("/dir/*", (req, res) => {
  // @ts-ignore
  const publicDirname = req.params[0] as string;
  const actualDirname = `public/${publicDirname}`;
  if (
    !fs.existsSync(actualDirname) ||
    !fs.statSync(actualDirname).isDirectory()
  )
    return res.status(404).end();
  const isTop = publicDirname === "";
  const dirName = path.dirname(publicDirname);
  const items = fs
    .readdirSync(actualDirname)
    .map((name) => {
      const fp = `/${publicDirname}/${name}`.replace(/\/{2,}/g, "/");
      const acFp = `${actualDirname}/${name}`;
      const isDir = fs.statSync(acFp).isDirectory();
      const url = isDir ? `/dir${fp}` : fp;
      if (isDir) name += "/";
      return {
        name,
        url,
        isDir,
        html: `<li style="padding:.25rem 0"><a href="${url}"${
          isDir ? "" : ' target="_blank"'
        } style="color:#fff;">${name}</a></li>`,
      };
    })
    .sort((a, b) => +b.isDir - +a.isDir);
  const parentLink = isTop
    ? ""
    : `<li style="padding:.25rem 0"><a style="color:#fff;" href="/dir/${dirName}">..</a></li>`;
  res.send(
    `<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><title>${actualDirname}</title></head><body style="background:#000;color:#fff;font-family:consolas;font-size:large;margin:0;padding:2rem;"><ul>${parentLink}${items
      .map(({ html }) => html)
      .join("")}</ul></body></html>`
  );
});

apis.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../pages/dashboard.html"));
});

import { convertCurrency, getCurrencyList } from "../services/currency";
apis.use("/currency", async (req, res) => {
  const { from, to } = parseForm(req);
  res.send({ rate: await convertCurrency(from, to) });
});
apis.use("/currency-text", async (req, res) => {
  const { from, to } = parseForm(req);
  const rate = await convertCurrency(from, to);
  res.send(`1 ${from} = ${rate} ${to}`);
});
apis.use("/currency-list", async (req, res) => {
  res.send(await getCurrencyList());
});

import googleTranslate from "../services/google-translate";
apis.use("/translate", async (req, res) => {
  const { text, from, to } = parseForm(req);
  try {
    res.status(200).json(await googleTranslate(text, { from, to }));
  } catch (error) {
    res.status(500).json({ error });
  }
});
apis.use("/translate-text", async (req, res) => {
  const { text, from, to } = parseForm(req);
  try {
    res.status(200).json((await googleTranslate(text, { from, to })).text);
  } catch (error) {
    res.status(500).json("");
  }
});

import { ytdlGetInfo, ytdlDownloadMp3 } from "../services/ytdl";
apis.use("/yt-to-mp3/:filename", async (req, res) => {
  const { src, source, id } = parseForm(req);
  const url = src || source || `https://youtu.be/${id}`;
  let filename = req.params.filename;
  if (!filename.endsWith(".mp3")) filename += ".mp3";
  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader("Content-Type", "audio/mpeg");
    (await ytdlDownloadMp3(url)).pipe(res);
  } catch (error) {
    res.status(500).json({ error });
  }
});
apis.use("/yt-to-mp3", async (req, res) => {
  const { src, source } = parseForm(req);
  const { api } = await ytdlGetInfo(src || source);
  return res.redirect(api);
});

import wikipedia from "../services/wikipedia";
apis.use("/wikipedia", async (req, res) => {
  const { query, q, article, a, title, t, page, p, language, lang, l } =
    parseForm(req);
  const searchTerm: string =
    a || q || p || t || query || article || page || title;
  const langCode: string | undefined = l || lang || language;
  if (!searchTerm) return res.status(400).send({ error: "Invalid body" });
  res.type("text/plain; charset=utf-8");
  res.send(await wikipedia(searchTerm, langCode));
});

import { fetchWebpage } from "../services/crawl";
apis.use("/crawl", async (req, res) => {
  const { url } = parseForm(req);
  if (!url) return res.status(400).send({ error: "Invalid body" });
  res.send(await fetchWebpage(url));
});
apis.use("/crawl-text", async (req, res) => {
  const { url } = parseForm(req);
  if (!url) return res.status(400).send({ error: "Invalid body" });
  const { title, description, content } = await fetchWebpage(url);
  res.type("text/plain; charset=utf-8");
  res.send(
    [
      title ? `title:\n${title}` : "",
      description ? `description:\n${description}` : "",
      `content:\n${content}`,
    ]
      .filter((i) => i)
      .join("\n\n")
  );
});

import {
  ddgSearch,
  ddgSearchSummary,
  googleSearch,
  googleSearchSummary,
  googleSearchSummaryV2,
} from "../services/search";
apis.use("/google-search", async (req, res) => {
  const { query } = parseForm(req);
  if (!query) return res.status(400).send({ error: "Invalid body" });
  res.send(await googleSearch(query));
});
apis.use("/ddg-search", async (req, res) => {
  const { query } = parseForm(req);
  if (!query) return res.status(400).send({ error: "Invalid body" });
  res.send(await ddgSearch(query));
});
apis.use("/google-search-summary", async (req, res) => {
  const { query, showUrl = true, v = 2 } = parseForm(req);
  if (!query) return res.status(400).send({ error: "Invalid body" });
  res.type("text/plain; charset=utf-8");
  if (v == 2) res.send(await googleSearchSummaryV2(showUrl, query));
  else res.send(await googleSearchSummary(showUrl, query));
});
apis.use("/ddg-search-summary", async (req, res) => {
  const { query, showUrl = true } = parseForm(req);
  if (!query) return res.status(400).send({ error: "Invalid body" });
  res.type("text/plain; charset=utf-8");
  res.send(await ddgSearchSummary(showUrl, query));
});

import lockerManager, { type LockerOptions } from "../services/lockers";
apis.put("/lockers", (req, res) => {
  const {
    id,
    item,
    options = {},
  } = parseForm(req) as { id?: string; item: any; options: LockerOptions };
  res.type("application/json");
  try {
    if (typeof id === "string")
      res.send(lockerManager.putItem(id, item, options?.privateKey));
    else res.send(lockerManager.addItem(item, options));
  } catch (err) {
    res
      .status(400)
      .send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});
apis.post("/lockers", (req, res) => {
  const { id, options = {} } = parseForm(req) as {
    id: string;
    options: LockerOptions;
  };
  res.type("application/json");
  try {
    res.send(lockerManager.getItem(id, options?.privateKey));
  } catch (err) {
    res
      .status(400)
      .send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});
apis.delete("/lockers", (req, res) => {
  const { id } = parseForm(req) as { id: string };
  res.type("application/json");
  try {
    res.send(lockerManager.destroyItem(id));
  } catch (err) {
    res
      .status(400)
      .send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});

import yadisk from "../services/yadisk";
import ls from "../services/ls";
const isDisableLS = Number(process.env.STOP_LS);
apis.get("/ls/list", (req, res) => {
  res.type("application/json");
  try {
    res.send(ls.list);
  } catch (err) {
    res.status(500).send(`${err}`);
  }
});
apis.get("/ls/:fn", (req, res) => {
  res.type("application/json");
  try {
    res.send(ls.get(req.params.fn));
  } catch (err) {
    res.status(404).send(`Not Found`);
  }
});
apis.get("/ls/i/:chap_problem", async (req, res) => {
  if (isDisableLS) return res.status(500).end();
  const chap_problem = req.params.chap_problem;
  const isbn = req.query.b || req.query.isbn;
  const id = req.query.id || chap_problem;
  if (isbn && chap_problem) {
    const filename = `${isbn}_${chap_problem}.png`;
    res.redirect(
      `https://raw.githubusercontent.com/cch137/ggehc/main/static/${isbn}/${filename}`
    );
    return;
  }
  try {
    const download =
      (req.query.download || req.query.dl || 0).toString() != "0";
    if (!id) throw "NOT FOUND";
    const resource = await yadisk.preview(`https://yadi.sk/i/${id}`);
    res.setHeader(
      "Content-Disposition",
      `${download ? "attachment; " : ""}filename="${resource.filename}"`
    );
    res.type(resource.type);
    if (resource.started) res.send(await resource.data);
    else resource.stream.pipe(res);
  } catch (err) {
    res.redirect(`https://disk.yandex.com/i/${id}`);
    // res.status(404).send(`Not Found`);
  }
});

import { fetchWeather, fetchWeatherText } from "../services/weather";
apis.use("/weather", async (req, res) => {
  const { city, loc, location, unit, lang } = parseForm(req);
  const _city = city || loc || location;
  if (!_city) return res.status(400).send({ error: "Invalid body" });
  res.json(await fetchWeather(_city, { unit, lang }));
});
apis.use("/weather-text", async (req, res) => {
  const { city, loc, location, unit, lang } = parseForm(req);
  const _city = city || loc || location;
  if (!_city) return res.status(400).send({ error: "Invalid body" });
  res.type("text/plain; charset=utf-8");
  res.send(await fetchWeatherText(_city, { unit, lang }));
});

import { ImagesToPDF } from "../services/pdf-tools";
apis.use("/images-to-pdf/create-task", async (req, res) => {
  res.json({ id: ImagesToPDF.createTask().id });
});
apis.use("/images-to-pdf/upload/:id/:index", async (req, res) => {
  const { id, index } = req.params;
  ImagesToPDF.upload(id, Number(index), req.body);
  res.json({ ok: 1 });
});
apis.use("/images-to-pdf/convert/:id/:filename", async (req, res) => {
  const { id, filename } = req.params;
  if (!filename.endsWith(".pdf"))
    return res.redirect(`/images-to-pdf/convert/${id}/${filename}.pdf`);
  res.type("application/pdf");
  res.send(Buffer.from(await ImagesToPDF.convert(id)));
});

import { unpackData } from "@cch137/utils/shuttle";
import { readStream } from "@cch137/utils/stream";
apis.use("/proxy/:url", async (req, res) => {
  try {
    const url = req.params.url;
    const reader = (await fetch(url)).body!.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (value) res.write(value);
      if (done) break;
    }
  } catch {
  } finally {
    res.end();
  }
});
apis.use("/proxy", async (req, res) => {
  try {
    const { input, ...init } = unpackData<{ [key: string]: any }>(req.body, 0);
    const _res = await fetch(input, init);
    _res.headers.forEach((v, k) => {
      if (/Set-Cookie/i.test(k)) return;
      if (/Content-/i.test(k) && !/Content-Type/i.test(k)) return;
      res.appendHeader(k, v);
    });
    res.write(await readStream(_res.body));
    res.end();
  } catch (e) {
    res.status(500).send(e instanceof Error ? e.message : e);
  }
});

import ccamc from "../services/ccamc";
apis.use("/ccamc-images", async (req, res) => {
  try {
    const { q } = parseForm(req);
    const result = await ccamc.getCharImages(q);
    res.json(result);
  } catch (e) {
    res.status(500).send(e instanceof Error ? e.message : e);
  }
});
apis.use("/ccamc-infer", async (req, res) => {
  try {
    const { q } = parseForm(req);
    const result = await ccamc.getInfer(q);
    res.json(result);
  } catch (e) {
    res.status(500).send(e instanceof Error ? e.message : e);
  }
});

import dictionary, { isDictionaryItem } from "../services/notion/dictionary";
import { read } from "pdfkit";
const ntDict = express.Router();
const { API_KEY } = process.env;
apis.use("/nt-dict/", ntDict);
ntDict.use("/", (req, res, next) => {
  if (req.headers["authorization"] !== API_KEY) {
    res.status(401).json({});
    return;
  }
  next();
});
ntDict.get("/random-item", async (req, res) => {
  try {
    res.json(await dictionary.getRandomItem());
  } catch {
    res.status(500).json({ success: false });
  }
});
ntDict.post("/create", async (req, res) => {
  const page = parseForm(req);
  try {
    if (!isDictionaryItem(page)) throw new Error("Invalid Item");
    await dictionary.createItem(page);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});
ntDict.post("/search", async (req, res) => {
  const { query, q } = parseForm(req);
  const _query = String(query || q);
  try {
    res.json(await dictionary.searchItem(_query));
  } catch {
    res.status(500).json({ success: false });
  }
});
ntDict.put("/:id", async (req, res) => {
  const { id } = req.params;
  const page = parseForm(req);
  try {
    if (!isDictionaryItem(page)) throw new Error("Invalid Item");
    await dictionary.updateItem(id, page);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});
ntDict.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    res.json(await dictionary.getItem(id));
  } catch {
    res.status(500).json({ success: false });
  }
});
ntDict.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dictionary.deleteItem(id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

export default apis;
