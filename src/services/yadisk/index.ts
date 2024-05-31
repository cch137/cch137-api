import axios from "axios";
import qs from "qs";
import { sum } from "@cch137/utils/number";

interface Cache {
  started: boolean;
  data: Promise<Buffer> | Buffer;
  stream?: any;
  type: string;
  filename: string;
}

const caches: [string, Cache][] = [];

function get_cache(key: string) {
  for (let i = 0; i < caches.length; i++) {
    const cache = caches[i];
    if (cache[0] === key) {
      caches.splice(i, 1);
      caches.unshift(cache);
      return cache[1];
    }
  }
  return null;
}

function set_cache(key: string, value: Cache) {
  caches.unshift([key, value]);
  (async () => {
    await value.data;
    // max cache size = 64MB
    while (
      sum(
        ...(await Promise.all(
          caches.map(async (c) => (await c[1].data).length)
        ))
      ) > 64_000_000
    )
      caches.pop();
  })();
  return value;
}

async function _preview(url: string) {
  const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`;
  const resourceUrl = (await axios.get(metadataUrl)).data.href as string;
  const { content_type: type, filename } = qs.parse(
    resourceUrl.split("?").at(-1) as string
  );
  const resource = await axios.get(resourceUrl, { responseType: "stream" });
  let started = false;
  const cache: Cache = {
    get started() {
      return started;
    },
    data: new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      resource.data.on("data", (chunk: any) => {
        chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk)),
          (started = true);
      });
      resource.data.on("end", () => {
        (cache.data = Buffer.concat(chunks)), resolve(cache.data);
        delete cache.stream;
      });
      resource.data.on("error", (err: any) => reject(err));
    }),
    stream: resource.data,
    type:
      type ||
      resource.headers["content-type"] ||
      resource.headers["Content-Type"],
    filename: (filename || "").toString(),
  };
  return cache;
}

async function preview(url: string) {
  const cache = get_cache(url);
  if (cache !== null) return cache;
  let i = 0;
  while (i++ < 3) {
    try {
      return set_cache(url, await _preview(url));
    } catch (err) {
      // console.error(err);
    }
  }
  throw "too many retries";
}

// (async () => {
//   const fs = await import("fs");
//   const jimp = await import("jimp");
//   interface PageObj {
//     isbn_c_p: string;
//     link: string;
//   }
//   // if you want to change the source, remember also change the isbn below
//   const list: PageObj[] = JSON.parse(
//     fs.readFileSync(
//       "./data/ls/dirs/Boyce W.,DiPrima R. Elementary Differential Equations and Boundary Value Problems 10ed 2012 9780470458310.json",
//       "utf8"
//     )
//   );
//   function fileList() {
//     return fs.readdirSync("./ls/");
//   }
//   function hasFile(id: string) {
//     return fileList().includes(`${id}.png`);
//   }
//   function processFile(obj: PageObj, tries: number = 0): Promise<any> {
//     return new Promise<void>(async (resolve, reject) => {
//       const { isbn_c_p, link } = obj;
//       if (hasFile(isbn_c_p)) {
//         return resolve();
//       }
//       console.log("processing:", isbn_c_p);
//       try {
//         const response = await preview(link);
//         const fp = `./data/ls/files/${isbn_c_p.split("_")[0]}/${isbn_c_p}.png`;
//         if (response.started) {
//           fs.writeFileSync(fp, await response.data);
//         } else {
//           const writableStream = fs.createWriteStream(fp);
//           response.stream.pipe(writableStream);
//         }
//         console.log("done", isbn_c_p /*`${fileList().length}/${list.length}`*/);
//         resolve();
//       } catch (e) {
//         console.log("error:", isbn_c_p);
//         return resolve(await processFile(obj, tries + 1));
//       }
//     });
//   }
//   let i = 0;
//   const p = "./data/ls/files/9780470458310/";
//   try {
//     fs.mkdirSync(p);
//   } catch {}
//   // === CHECK FILES START ===
//   // const list2 = fs.readdirSync(p);
//   // const list2length = list2.length;
//   // for (let i2 = 0; i2 < list2length; i2++) {
//   //   const f = list2[i2];
//   //   try {
//   //     await jimp.read(`${p}${f}`);
//   //     console.log(`checked: ${i2 + 1} / ${list2length}`);
//   //   } catch (e) {
//   //     const isbn_c_p = f.substring(0, f.length - 4);
//   //     for (const fobj of list) {
//   //       if (fobj.isbn_c_p === isbn_c_p) {
//   //         setTimeout(() => processFile(fobj), 100 * i++);
//   //         break;
//   //       }
//   //     }
//   //   }
//   // }
//   // console.log("Check Done!");
//   // === CHECK FILES END ===
//   // WARNING: PROCESS FILES HERE !!!
//   // === PROCESS FILES START ===
//   // for (const obj of list) {
//   //   setTimeout(() => processFile(obj), 100 * i++);
//   // }
//   // console.log("Process Done!");
//   // === PROCESS FILES END ===
// })();

export default {
  preview,
};
