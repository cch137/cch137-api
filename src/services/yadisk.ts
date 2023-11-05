import axios from "axios"
import qs from "qs"
import fs from "fs"

const caches: [string,any][] = [];

function get_cache(key: string) {
  for (const cache of caches) {
    if (cache[0] === key) return cache[1];
  }
  return null;
}

function set_cache<T>(key: string, value: T) {
  caches.unshift([key, value]);
  while (caches.length > 256) caches.pop();
  return value;
}

async function preview(url: string) {
  const cache = get_cache(url);
  if (cache !== null) return cache;
  const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`
  const resourceUrl = (await axios.get(metadataUrl)).data.href as string;
  const { content_type: type, filename } = qs.parse(resourceUrl.split('?').at(-1) as string);
  const resource = await axios.get(resourceUrl, { responseType: 'stream' });
  let cached = false;
  return set_cache(url, {
    get cached () { return cached },
    data: new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      resource.data.on('data', (chunk: any) => chunks.push(chunk));
      resource.data.on('end', () => { resolve(Buffer.concat(chunks)), cached = true });
      resource.data.on('error', (err: any) => reject(err));
    }),
    stream: resource.data,
    type: type || resource.headers['content-type'] || resource.headers['Content-Type'],
    filename
  });
}

export default {
  preview
}