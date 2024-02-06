import axios from 'axios'
import htmlTableTo2DArray from '../utils/htmlTableTo2DArray'

const url = 'https://docs.google.com/spreadsheets/d/1VjdmK8-PBoOt6sRCvZ40G5qmYyxpLzHl5RCSQWejxYk/preview/sheet?gid=1360697588'
let lastFetched = 0
let fetching: Promise<void> | null = null
const currenctSet = new Set<string>()
const currencyMap = new Map<string,number>()

async function _fetchCurrencies() {
  if (fetching === null) {
    fetching = (async () => {
      const res = await axios.get(url)
      const table = htmlTableTo2DArray(res.data).map(r => r.slice(1, 4)) as string[][]
      currencyMap.clear()
      currenctSet.clear()
      for (const row of table) {
        if (!(row[0] && row[1])) continue;
        const key = `${row[0]}${row[1]}`
        if (key) {
          currencyMap.set(key, +row[2])
          currenctSet.add(row[0] as string)
        }
      }
      fetching = null
    })()
  }
  return await fetching
}

async function getCurrencyMap() {
  if (lastFetched + 5 * 60000 < Date.now()) {
    if (currencyMap.size === 0) {
      await _fetchCurrencies()
    } else {
      _fetchCurrencies()
    }
    lastFetched = Date.now()
  }
  return currencyMap
}

async function convertCurrency(fromCurrency: string, toCurrency: string): Promise<number> {
  return (await getCurrencyMap()).get(`${fromCurrency}${toCurrency}`) || 0
}

async function getCurrencyList() {
  if (currencyMap.size === 0) {
    await getCurrencyMap();
  }
  return [...currenctSet];
}

export {
  convertCurrency,
  getCurrencyList,
}