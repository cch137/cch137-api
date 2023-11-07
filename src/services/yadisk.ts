import axios from "axios"
import qs from "qs"
import sum from "../utils/sum";

interface Cache {
  started: boolean
  data: Promise<Buffer> | Buffer
  stream?: any
  type: string
  filename: string
}

const caches: [string,Cache][] = [];

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
    while (sum(...(await Promise.all(caches.map(async c => (await c[1].data).length)))) > 64_000_000) caches.pop();
  })();
  return value;
}

async function _preview(url: string) {
  const cache = get_cache(url);
  if (cache !== null) return cache;
  const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`
  const resourceUrl = (await axios.get(metadataUrl)).data.href as string;
  const { content_type: type, filename } = qs.parse(resourceUrl.split('?').at(-1) as string);
  const resource = await axios.get(resourceUrl, { responseType: 'stream' });
  let started = false;
  const _cache = set_cache(url, {
    get started() { return started },
    data: new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      resource.data.on('data', (chunk: any) => { chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk)), started = true });
      resource.data.on('end', () => { _cache.data = Buffer.concat(chunks), resolve(_cache.data); delete _cache.stream });
      resource.data.on('error', (err: any) => reject(err));
    }),
    stream: resource.data,
    type: type || resource.headers['content-type'] || resource.headers['Content-Type'],
    filename: (filename || '').toString(),
  });
  return _cache;
}

async function preview(url: string) {
  let i = 0;
  while (i++ < 3) {
    try {
      return await _preview(url);
    } catch (err) {
      console.log(err);
    }
  }
  throw 'too many retries';
}

export default {
  preview
}
