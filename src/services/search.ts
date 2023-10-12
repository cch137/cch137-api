import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import fs from 'fs'
import qs from 'qs'

interface SearcherResultItem {
  title?: string;
  description: string;
  url: string;
}

const ddgSearch = async (...queries: string[]) => {
  return (await Promise.all(queries.map(async (query) => {
    try {
      const searching = (await axios.get(`https://ddg-api.herokuapp.com/search?query=${query}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50'
        }
      })).data as { title: string, link: string, snippet: string }[]
      return searching.map((p) => ({ title: p.title || '', url: p.link || '', description: p.snippet || '' })) as SearcherResultItem[]
    } catch {
      return []
    }
  }))).flat()
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
    if (!(/^https?:/).test(url)) return null
    return { url, title, description }
  }).filter(i => i) as SearcherResultItem[]
}

const googleSearch = async (...queries: string[]) => {
  return (await Promise.all(queries.map(q => _googleSearch(q)))).flat()
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

export {
  googleSearch,
  ddgSearch,
  googleSearchSummary,
  ddgSearchSummary
}
