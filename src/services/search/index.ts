import axios from "axios";
import { load as cheerioLoad } from "cheerio";
import type { CheerioAPI, Element } from "cheerio";
import qs from "qs";
import random from "@cch137/utils/random/index.js";

interface SearcherResultItem {
  title: string;
  description: string;
  url: string;
}

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
];

function urlTest(url: string) {
  return /^https?:/.test(url);
}

function createHeader() {
  return {
    "User-Agent": random.choice(userAgents) as string,
  };
}

async function _ddgSearch(query: string) {
  const region = "wt-wt";
  const timelimit = undefined;
  const safesearch = "off";

  const headers = createHeader();

  const res1 = await axios.get(
    `https://duckduckgo.com/?${qs.stringify({
      q: query,
      kl: region,
      p: { on: 1, moderate: -1, off: -2 }[safesearch],
      df: timelimit,
    })}`,
    { headers }
  );
  const $1 = cheerioLoad(res1.data);
  const href1 = $1("#deep_preload_link").attr("href") || "";
  const href2 = $1("#deep_preload_script").attr("src") || "";
  const vqd = (
    qs.parse(href1.split("?").at(-1) || "") ||
    qs.parse(href2.split("?").at(-1) || "")
  )?.vqd;

  const ddgSeaerchUrl = `https://links.duckduckgo.com/d.js?${qs.stringify({
    q: query,
    kl: region,
    l: region,
    bing_market: `${region.split("-")[0]}-${(
      region.split("-").at(-1) || ""
    ).toUpperCase()}`,
    s: 0,
    df: timelimit,
    vqd: vqd,
    o: "json",
    sp: 0,
  })}`;

  return (
    (await axios.get(ddgSeaerchUrl, { headers })).data.results as {
      u?: string;
      t?: string;
      a?: string;
    }[]
  )
    .map((r) => ({
      title: r.t || "",
      description: cheerioLoad(r.a || "").text(),
      url: r.u || "",
    }))
    .filter((r) => urlTest(r.url));
}

async function _googleSearch(query: string): Promise<SearcherResultItem[]> {
  // old version use 'googlethis' package
  const res = await axios.get(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`
  );
  const $ = cheerioLoad(res.data);
  const items = [...$("#main").children("div")];
  items.shift();
  while (items[0].children.length == 0) {
    items.shift();
  }
  return items
    .map((item) => {
      const a = $(item).find("a").first();
      const url =
        (qs.parse((a.attr("href") || "").split("?").at(-1) || "")
          ?.q as string) || "";
      const title = a.find("h3").first().text() || undefined;
      const description =
        $(item).children().last().children().last().text().replace(/�/g, "") ||
        undefined;
      if (!urlTest(url)) return null;
      return { url, title, description };
    })
    .filter((i) => i) as SearcherResultItem[];
}

export const ddgSearch = async (...queries: string[]) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map((q) => _ddgSearch(q)))).flat();
    } catch (err) {
      console.log(err);
    }
  }
  return [];
};

export const googleSearch = async (...queries: string[]) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map((q) => _googleSearch(q)))).flat();
    } catch (err) {
      console.log(err);
    }
  }
  return [];
};

const summary = (items: SearcherResultItem[], showUrl: boolean = true) => {
  const pages = new Map<string, SearcherResultItem>();
  items.forEach((value) => pages.set(value.url, value));
  items = [...pages.values()];
  return [
    ...new Set(
      items.map(
        (r) =>
          `${showUrl ? r.url + "\n" : ""}${r.title ? r.title : ""}\n${
            r.description
          }`
      )
    ),
  ].join("\n\n");
};

export const ddgSearchSummary = async (
  showUrl = true,
  ...queries: string[]
) => {
  return summary(await ddgSearch(...queries), showUrl);
};

export const googleSearchSummary = async (
  showUrl = true,
  ...queries: string[]
) => {
  return summary(await googleSearch(...queries), showUrl);
};

const googleExtractText = (
  $: CheerioAPI,
  el: Element,
  isRoot: boolean = false,
  showUrl: boolean = true
): string => {
  try {
    const children = $(el).children("*");
    let href = $(el).prop("href") || undefined;
    if (href && href.startsWith("/search")) throw "no need";
    let text = (
      children.length == 0
        ? $(el).text()
        : [...children]
            .map((c) => googleExtractText($, c, false, showUrl))
            .join("\n")
    ).trim();
    if (href?.startsWith("/url"))
      href = ((qs.parse(href.split("?")[1]) || {}).q as string) || "";
    else href = undefined;
    return `${showUrl && href ? href + "\n" : ""}${text}`;
  } catch (e) {
    if (isRoot) return "";
    else throw e;
  }
};

const _googleSearchSummaryV2 = async (
  query: string,
  showUrl: boolean = true
) => {
  const res = await axios.get(`https://www.google.com.sg/search?q=${query}`);
  const $ = cheerioLoad(res.data);
  const items = [...$("#main").children("div")];
  const text = items
    .map((i) => googleExtractText($, i, true))
    .join("\n\n")
    .trim()
    .replace(/(\n{2,})/g, "\n\n")
    .replace(/�/g, "");
  return text;
};

export const googleSearchSummaryV2 = async (
  showUrl = true,
  ...queries: string[]
) => {
  return (
    await Promise.all(
      queries.map((query) => _googleSearchSummaryV2(query, showUrl))
    )
  ).join("\n\n---\n\n");
};
