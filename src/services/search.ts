import googlethis from 'googlethis'
import axios from 'axios'

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

const googleSearch = async (...queries: string[]) => {
  return (await Promise.all(queries.map(async (query) => {
    try {
      const searching = await googlethis.search(query)
      return [...searching.results, ...searching.top_stories] as SearcherResultItem[]
    } catch {
      return []
    }
  }))).flat()
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
