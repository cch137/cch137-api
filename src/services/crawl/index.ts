import axios from "axios";
import { load as cheerioLoad } from "cheerio";
import type { AnyNode } from "cheerio";
import puppeteer from "puppeteer";
import TurndownService from "turndown";
// @ts-ignore
import { gfm } from "@joplin/turndown-plugin-gfm";

function joinURL(baseURL: string, relativeURL: string) {
  const urlParts = baseURL.split("/"),
    relativeParts = relativeURL.split("/");
  urlParts.pop();
  for (const part of relativeParts) {
    if (part === "..") urlParts.pop();
    else if (part !== ".") urlParts.push(part);
  }
  return urlParts.join("/");
}

function parseHtml(
  html: string | AnyNode | AnyNode[] | Buffer,
  {
    url,
    links = false,
    showATag = false,
    textOnly = true,
  }: { url: string; links?: boolean; showATag?: boolean; textOnly?: boolean }
) {
  const $ = cheerioLoad(html);
  $("style").remove();
  $("script").remove();
  if (textOnly) {
    $("img").remove();
    $("video").remove();
    $("audio").remove();
    $("canvas").remove();
    $("svg").remove();
  }
  const origin = new URL(url).origin;
  const linkSet = new Set<string>();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (typeof href === "string" && !linkSet.has(href)) {
      if (href.startsWith("/")) linkSet.add(origin + href);
      else if (href.startsWith("#")) linkSet.add(url + href);
      else if (href.startsWith("../") || href.startsWith("./"))
        linkSet.add(joinURL(url, href));
      else linkSet.add(href);
    }
  });
  if (!showATag)
    $("a").replaceWith(function () {
      return $("<span>").text($(this).prop("innerText") || $(this).text());
    });
  const td = new TurndownService();
  td.use(gfm);
  const markdown = td.turndown($("body").prop("innerHTML") as string);
  return {
    title:
      $("title").text() ||
      $('meta[name="title"]').attr()?.content ||
      $('meta[name="og:title"]').attr()?.content,
    description:
      $('meta[name="description"]').attr()?.content ||
      $('meta[name="og:description"]').attr()?.content,
    links: links ? [...linkSet] : undefined,
    content: markdown.replace(/<br>/g, "\n").trim(),
  };
}

const fixUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) return url;
  return `http://${url}`;
};

export async function fetchWebpageWithPupeeter(url: string) {
  url = fixUrl(url);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return parseHtml(html, { url });
}

export async function fetchWebpage(
  url: string,
  options: { textOnly?: boolean; links?: boolean } = {}
) {
  try {
    url = fixUrl(url);
    const res = await axios.get(url, {
      timeout: 60000,
      validateStatus: () => true,
      responseType: "arraybuffer",
      responseEncoding: "latin1",
    });
    const buffer = await res.data;
    const decoder = new TextDecoder("iso-8859-1");
    const content = decoder.decode(buffer);
    return parseHtml(content, { ...options, url });
  } catch (e) {
    return {
      title:
        e instanceof Error
          ? `Error: ${e.message || e.name || "Unknown"}`
          : "Error: Failed to fetch",
      description: "",
      content: "",
      links: options.links ? [] : undefined,
    };
  }
}
