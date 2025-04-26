import Jet from "@cch137/jet";

const apis = new Jet.Router();

apis.use(Jet.mergeQuery());

apis.static("/", "public/");

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

import currency from "../services/currency/index.js";
apis.use("/currency", currency);

import googleTranslate from "../services/google-translate/index.js";
apis.use("/translate", async (req, res) => {
  const { text, from, to } = req.query;
  if (!text || typeof text !== "string")
    return res.status(400).json({ error: "Invalid body" });
  if (from !== undefined && typeof from !== "string")
    return res.status(400).json({ error: "Invalid body" });
  if (to !== undefined && typeof to !== "string")
    return res.status(400).json({ error: "Invalid body" });
  try {
    res.status(200).json(await googleTranslate(text, { from, to }));
  } catch (error) {
    res.status(500).json({ error });
  }
});
apis.use("/translate-text", async (req, res) => {
  const { text, from, to } = req.query;
  if (!text || typeof text !== "string")
    return res.status(400).json({ error: "Invalid body" });
  if (from !== undefined && typeof from !== "string")
    return res.status(400).json({ error: "Invalid body" });
  if (to !== undefined && typeof to !== "string")
    return res.status(400).json({ error: "Invalid body" });
  try {
    res.status(200).json((await googleTranslate(text, { from, to })).text);
  } catch (error) {
    res.status(500).json("");
  }
});

import { router as ytdlRouter } from "../services/ytdl/index.js";
apis.use("/youtube", ytdlRouter);

import wikipedia from "../services/wikipedia/index.js";
apis.use("/wikipedia", async (req, res) => {
  const { query, q, article, a, title, t, page, p, language, lang, l } =
    req.query;
  const searchTerm = a || q || p || t || query || article || page || title;
  const langCode = l || lang || language;
  if (
    !searchTerm ||
    typeof searchTerm !== "string" ||
    (langCode !== undefined && typeof langCode !== "string")
  )
    return res.status(400).send({ error: "Invalid body" });
  res.type("text/plain; charset=utf-8");
  res.send(await wikipedia(searchTerm, langCode));
});

import { fetchWeatherFromOpenWeather } from "../services/weather/index.js";
apis.use("/weather2", async (req, res) => {
  const { lat, lon, lang } = req.query;
  try {
    if (lat !== undefined && typeof lat !== "number")
      throw new Error("Invalid Param");
    if (lon !== undefined && typeof lon !== "number")
      throw new Error("Invalid Param");
    if (lang !== undefined && typeof lang !== "string")
      throw new Error("Invalid Param");

    res.json(await fetchWeatherFromOpenWeather({ lon, lat, lang }));
  } catch {
    res.status(400).end();
  }
});

import { ImagesToPDF, PDFToImages } from "../services/pdf-tools/index.js";
apis.use("/images-to-pdf/create-task", async (req, res) => {
  res.json({ id: ImagesToPDF.createTask().id });
});
apis.use("/images-to-pdf/upload/:id/:index", async (req, res) => {
  const { id, index } = req.params;
  ImagesToPDF.upload(id, Number(index), req.body as Uint8Array<ArrayBuffer>);
  res.json({ ok: 1 });
});
apis.use("/images-to-pdf/convert/:id/:filename", async (req, res) => {
  const { id, filename } = req.params;
  if (!filename.endsWith(".pdf"))
    return res.redirect(`/images-to-pdf/convert/${id}/${filename}.pdf`);
  res.type("application/pdf");
  res.send(Buffer.from(await ImagesToPDF.convert(id)));
});
apis.use("/pdf-to-images/convert/:filename", async (req, res) => {
  let { filename } = req.params;
  if (!filename.endsWith(".zip")) filename += ".zip";
  res.type("application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(filename)}`
  );
  res.send(
    Buffer.from(await PDFToImages.convert(req.body as Uint8Array<ArrayBuffer>))
  );
});

import downloadPPT from "../services/pine/download-ppt.js";
apis.use("/pine-ppt-dl/:filename", async (req, res) => {
  let { filename } = req.params;
  const { url, acc, pass } = req.query;
  if (!url || typeof url !== "string")
    return res.status(400).send("Invalid URL");
  if (!acc || typeof acc !== "string")
    return res.status(400).send("Invalid Account");
  if (!pass || typeof pass !== "string")
    return res.status(400).send("Invalid Password");
  if (!filename.endsWith(".pdf")) filename += ".pdf";
  try {
    const pdf = Buffer.from(await downloadPPT(url, acc, pass));
    res.type("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}`
    );
    res.send(pdf);
  } catch (e) {
    console.log(e);
    res.status(500).send(e instanceof Error ? e.message : `${e}`);
  }
});

import { router as wk } from "../services/wakawaka/index.js";
apis.use("/wk", wk);

import { router as gha } from "../services/github-assets/index.js";
apis.use("/gh", gha);

import { router as notion } from "../services/notion/index.js";
apis.use("/notion", notion);

import createEntangleServer from "@cch137/entangle/server.js";
import { completions } from "../services/groq/index.js";
apis.ws("/groq", (soc) => {
  completions[createEntangleServer.Handle](soc);
});

export default apis;
