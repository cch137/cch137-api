import axios from "axios"
import qs from "qs"

const caches: [string,any][] = [];

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

function set_cache<T>(key: string, value: T) {
  caches.unshift([key, value]);
  while (caches.length > 256) caches.pop();
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
    get started () { return started },
    data: new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      resource.data.on('data', (chunk: any) => { chunks.push(chunk), started = true });
      resource.data.on('end', () => { // @ts-ignore
        _cache.data = Buffer.concat(chunks), resolve(_cache.data); delete _cache.stream });
      resource.data.on('error', (err: any) => reject(err));
    }),
    stream: resource.data,
    type: type || resource.headers['content-type'] || resource.headers['Content-Type'],
    filename
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
