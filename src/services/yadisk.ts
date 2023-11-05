import axios from "axios"
import qs from "qs"

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
  const res = await axios.get(resourceUrl, { responseType: 'stream' });
  return set_cache(url, {
    res,
    data: res.data,
    type: type || res.headers['content-type'] || res.headers['Content-Type'],
    filename
  });
}

export default {
  preview
}