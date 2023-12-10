import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import type { CheerioAPI, Element, AnyNode } from 'cheerio'
import qs from 'qs'
import random from '../utils/random'
import puppeteer from 'puppeteer'
import TurndownService from 'turndown'
// @ts-ignore
import { gfm } from '@joplin/turndown-plugin-gfm'
import path from 'path'

interface SearcherResultItem {
  title: string;
  description: string;
  url: string;
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
]

function urlTest(url: string) {
  return (/^https?:/).test(url)
}

function createHeader () {
  return {
    'User-Agent': random.choice(userAgents) as string,
  }
}

async function _ddgSearch(query: string) {
  const region = 'wt-wt'
  const timelimit = undefined
  const safesearch = 'off'

  const headers =  createHeader()

  const res1 = await axios.get(`https://duckduckgo.com/?${qs.stringify({
    q: query,
    kl: region,
    p: ({on: 1, moderate: -1, off: -2})[safesearch],
    df: timelimit
  })}`, { headers })
  const $1 = cheerioLoad(res1.data)
  const href1 = $1('#deep_preload_link').attr('href') || ''
  const href2 = $1('#deep_preload_script').attr('src') || ''
  const vqd = (qs.parse(href1.split('?').at(-1) || '') || qs.parse(href2.split('?').at(-1) || ''))?.vqd

  const ddgSeaerchUrl = `https://links.duckduckgo.com/d.js?${qs.stringify({
    q: query,
    kl: region,
    l: region,
    bing_market: `${region.split('-')[0]}-${(region.split('-').at(-1) || '').toUpperCase()}`,
    s: 0,
    df: timelimit,
    vqd: vqd,
    o: 'json',
    sp: 0,
  })}`

  return ((await axios.get(ddgSeaerchUrl, { headers })).data.results as ({ u?: string, t?: string, a?: string })[])
    .map(r => ({
      title: r.t || '',
      description: cheerioLoad(r.a || '').text(),
      url: r.u || ''
    }))
    .filter(r => urlTest(r.url))
}

async function _googleSearch(query: string): Promise<SearcherResultItem[]> {
  // old version use 'googlethis' package
  const res = await axios.get(`https://www.google.com/search?q=${query}`)
  const $ = cheerioLoad(res.data)
  const items = [...$('#main').children('div')]
  items.shift()
  while (items[0].children.length == 0) {
    items.shift()
  }
  return items.map((item) => {
    const a = $(item).find('a').first()
    const url = qs.parse((a.attr('href') || '').split('?').at(-1) || '')?.q as string || ''
    const title = a.find('h3').first().text() || undefined
    const description = $(item).children().last().children().last().text().replace(/�/g, '') || undefined
    if (!urlTest(url)) return null
    return { url, title, description }
  }).filter(i => i) as SearcherResultItem[]
}

const ddgSearch = async (...queries: string[]) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map(q => _ddgSearch(q)))).flat()
    } catch (err) {
      console.log(err)
    }
  }
  return []
}

const googleSearch = async (...queries: string[]) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map(q => _googleSearch(q)))).flat()
    } catch (err) {
      console.log(err)
    }
  }
  return []
}

const summary = (items: SearcherResultItem[], showUrl: boolean = true) => {
    const pages = new Map<string, SearcherResultItem>()
    items.forEach((value) => pages.set(value.url, value))
    items = [...pages.values()]
  return [...new Set(items
    .map((r) => `${showUrl ? r.url + '\n' : ''}${r.title ? r.title : ''}\n${r.description}`))
  ].join('\n\n')
}

const ddgSearchSummary = async (showUrl=true, ...queries: string[]) => {
  return summary(await ddgSearch(...queries), showUrl)
}

const googleSearchSummary = async (showUrl=true, ...queries: string[]) => {
  return summary(await googleSearch(...queries), showUrl)
}

function googleExtractText($: CheerioAPI, el: Element, isRoot: boolean = false, showUrl: boolean = true): string {
  try {
    const children = $(el).children('*')
    let href = $(el).prop('href') || undefined
    if (href && href.startsWith('/search')) throw 'no need'
    let text = (children.length == 0
      ? $(el).text()
      : [...children].map(c => googleExtractText($, c, false, showUrl)).join('\n')).trim()
    if (href?.startsWith('/url')) href = (qs.parse(href.split('?')[1]) || {}).q as string || ''
    else href = undefined
    return `${showUrl && href ? href + '\n' : ''}${text}`
  } catch (e) {
    if (isRoot) return ''
    else throw e
  }
}

const _googleSearchSummaryV2 = async (query: string, showUrl: boolean = true) => {
  const res = await axios.get(`https://www.google.com.sg/search?q=${query}`)
  const $ = cheerioLoad(res.data)
  const items = [...$('#main').children('div')]
  const text = items.map(i => googleExtractText($, i, true)).join('\n\n').trim()
    .replace(/(\n{2,})/g, '\n\n').replace(/�/g, '')
  return text
}

const googleSearchSummaryV2 = async (showUrl=true, ...queries: string[]) => {
  return (await Promise.all(queries.map((query) => _googleSearchSummaryV2(query, showUrl)))).join('\n\n---\n\n')
}

// (() => {
//   function joinURL(baseURL: string, relativeURL: string) {
//     const urlParts = baseURL.split('/'), relativeParts = relativeURL.split('/');
//     urlParts.pop();
//     for (const part of relativeParts) {
//       if (part === '..') urlParts.pop();
//       else if (part !== '.') urlParts.push(part);
//     }
//     return urlParts.join('/');
//   }

//   function parseHtml(html: string | AnyNode | AnyNode[] | Buffer, url: string, textOnly = true) {
//     const $ = cheerioLoad(html)
//     $('style').remove()
//     $('script').remove()
//     if (textOnly) {
//       $('img').remove()
//       $('video').remove()
//       $('audio').remove()
//       $('canvas').remove()
//       $('svg').remove()
//     }
//     const origin = new URL(url).origin
//     const links = new Set<string>()
//     $('a').each((_, el) => {
//       const href = $(el).attr('href')
//       if (typeof href === 'string' && !links.has(href)) {
//         if (href.startsWith('/')) links.add(origin + href)
//         else if (href.startsWith('#')) links.add(url + href)
//         else if (href.startsWith('../') || href.startsWith('./')) links.add(joinURL(url, href))
//         else links.add(href)
//       }
//     })
//     // $('a').replaceWith(function () {
//     //   return $('<span>').text($(this).prop('innerText') || $(this).text())
//     // })
//     const td = new TurndownService()
//     td.use(gfm)
//     const markdown = td.turndown($('body').prop('innerHTML') as string)
//     return {
//       title: $('title').text() || $('meta[name="title"]').attr()?.content || $('meta[name="og:title"]').attr()?.content,
//       description: $('meta[name="description"]').attr()?.content || $('meta[name="og:description"]').attr()?.content,
//       links: [...links],
//       content: markdown.replace(/<br>/g, '\n').trim(),
//     }
//   }

//   async function _fetchHTML(url: string) {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url);
//     const html = await page.content();
//     await browser.close();
//     return parseHtml(html, url);
//   }

//   async function fetchHTML(url: string) {
//     return parseHtml((await axios.get(url)).data, url);
//   }

//   // 這是一個測試用例
//   const url = 'https://zh.wikipedia.org/zh-tw/%E8%B6%85%E5%A4%A7%E8%A7%84%E6%A8%A1%E9%9B%86%E6%88%90%E7%94%B5%E8%B7%AF'
//   _fetchHTML(url)
//     .then(html => console.log(1, html))
//     .catch(err => console.error('錯誤發生:', err))
//   fetchHTML(url)
//     .then(html => console.log(2, html))
//     .catch(err => console.error('錯誤發生:', err))
// })();

export {
  googleSearch,
  ddgSearch,
  googleSearchSummary,
  googleSearchSummaryV2,
  ddgSearchSummary
}
