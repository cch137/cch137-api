import { load } from "cheerio";

import createFetcher from "./downloader";
import { ImagesToPDF } from "../pdf-tools";

function parsePhpsessid(res: Response, def: string = "") {
  const setCookie = res.headers.get("Set-Cookie");
  if (!setCookie) {
    if (def) return def;
    throw new Error("Set-Cookie not found");
  }
  const match = /PHPSESSID=([0-9a-zA-Z]+);?/.exec(setCookie);
  if (!match) {
    if (def) return def;
    throw new Error("PHPSESSID not found");
  }
  return match[1];
}

const origin = `https://${["wt.", "ude.", "ucn.", "ssalc", "eeucn"]
  .join("")
  .split("")
  .reverse()
  .join("")}`;

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0";

async function getPhpSessid(account: string, password: string) {
  const url0 = `${origin}/index/login`;
  const url1 = `${origin}/index/login`;
  const url2 = `${origin}/dashboard`;
  const res0 = await fetch(url0, {
    headers: {
      "User-Agent": userAgent,
    },
  });
  const phpsessid = parsePhpsessid(res0, "");
  const html0 = await res0.text();
  const $ = load(html0);
  const anticsrf = $("input[name=anticsrf]")
    .map((i, el) => el.attributes.find((v) => v.name === "value")?.value)
    .toArray()[0];
  const form = `_fmSubmit=yes&formVer=3.0&formId=login_form&next=&act=keep&account=${encodeURIComponent(
    account
  )}&password=${encodeURIComponent(
    password
  )}&rememberMe=1&anticsrf=${anticsrf}`;
  const res1 = await fetch(url1, {
    headers: {
      "User-Agent": userAgent,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: `PHPSESSID=${phpsessid}`,
    },
    method: "POST",
    body: form,
  });
  const html2 = await (
    await fetch(url2, {
      headers: {
        "User-Agent": userAgent,
        Cookie: `PHPSESSID=${phpsessid}`,
      },
    })
  ).text();
  const logoutLinkMatch =
    /\/ajax\/sys\.pages\.user\/user.logout\/\?ajaxAuth\=[a-zA-Z0-9]+/.exec(
      html2
    );
  const logoutLink = logoutLinkMatch ? logoutLinkMatch[0] : null;
  return {
    phpsessid: parsePhpsessid(res1, phpsessid),
    logout() {
      if (logoutLink)
        fetch(
          /^https?:\/\//.test(logoutLink) ? logoutLink : origin + logoutLink,
          {
            method: "POST",
            headers: {
              "User-Agent": userAgent,
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              Cookie: `PHPSESSID=${phpsessid}`,
              body: "next=",
            },
          }
        );
    },
  };
}

async function getImageLinks(url: string, phpsessid: string) {
  const res = await fetch(url, {
    headers: {
      Cookie: `PHPSESSID=${phpsessid}`,
      "User-Agent": userAgent,
    },
  });
  const html = await res.text();
  const $ = load(html);
  const images = $("section img");
  const links = images
    .map((i, el) => el.attributes.find((v) => v.name === "src")?.value)
    .toArray()
    .map((s) =>
      typeof s === "string" ? (s.startsWith("/") ? `${origin}${s}` : s) : ""
    );
  return links;
}

export async function downloadPPTImages(
  url: string,
  account: string,
  password: string
) {
  const { phpsessid, logout } = await getPhpSessid(account, password);
  const imageSources = await getImageLinks(url, phpsessid);
  logout();
  const init = {
    headers: {
      "User-Agent": userAgent,
    },
  };
  const fetcher = createFetcher(imageSources.map((input) => ({ input, init })));
  await fetcher.start();
  return (
    await Promise.all(
      fetcher.executed.map(async (task, i) => {
        const reader = task.res?.body?.getReader()!;
        const chunks: Uint8Array[] = [];
        while (true) {
          const { value, done } = await reader.read();
          if (value) chunks.push(value);
          if (done) break;
        }
        const filename = String(task.options.input)
          .split("/")
          .at(-1)!
          .padStart(12, "0");
        const buffer = new Uint8Array(Buffer.concat(chunks).buffer);
        return {
          filename,
          buffer,
        };
      })
    )
  )
    .sort((a, b) =>
      a.filename > b.filename ? 1 : a.filename < b.filename ? -1 : 0
    )
    .map(({ buffer }) => buffer);
}

export default async function downloadPPT(
  url: string,
  account: string,
  password: string
) {
  const images = await downloadPPTImages(url, account, password);
  const pdfTask = ImagesToPDF.createTask();
  images.forEach((image, i) => pdfTask.upload(i, image));
  return await pdfTask.convert();
}
