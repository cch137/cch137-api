import path from 'path';
import express, { Request, Response } from 'express';
import googlethis from 'googlethis';
import getIp from './utils/getIp.js';
import adaptParseBody from './utils/adaptParseBody';
import translate from '@saipulanuar/google-translate-api'
import ipManager from './services/ips';
import type { LockerOptions } from './services/lockers';
import lockerManager from './services/lockers';
import { ddgSearch, ddgSearchSummary, googleSearch, googleSearchSummary } from './services/search';
import { init as currencyInit, convertCurrency, getCurrencyList } from './services/currency'

const apisRouter = express.Router();

apisRouter.use('/', express.static('public/'));

apisRouter.get('/', (req, res) => {
  res.send({ t: Date.now() });
});

currencyInit()

apisRouter.use('/currency', async (req, res) => {
  const { from, to } = adaptParseBody(req);
  res.send({ rate: await convertCurrency(from, to) });
});

apisRouter.use('/currency-list', async (req, res) => {
  res.send(await getCurrencyList());
});

apisRouter.get('/dashboard', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../pages/dashboard.html'));
});

apisRouter.get('/ip', (req, res) => {
  res.send({ ip: getIp(req) });
});

((handle) => {
  apisRouter.use('/ip-location', handle);
  apisRouter.use('/ip-loc', handle);
})(async (req: Request, res: Response) => {
  const { ip, latest } = adaptParseBody(req)
  try {
    res.send(await ipManager.getIpLocation(ip || getIp(req), latest));
  } catch (error) {
    res.send({ error: 1 });
  }
});

apisRouter.use('/translate', async (req, res) => {
  const { text, from, to } = adaptParseBody(req)
  res.type('application/json')
  try {
    res.status(200).send(await translate(text, { from, to }))
  } catch (err) {
    res.send({ err })
  }
});

apisRouter.use('/googlethis', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search\'' })
});

apisRouter.use('/googleresult', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search-summary\'' })
});

apisRouter.use('/google-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await googleSearch(query))
});

apisRouter.use('/ddg-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await ddgSearch(query))
});

apisRouter.use('/google-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await googleSearchSummary(showUrl, query))
});

apisRouter.use('/ddg-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await ddgSearchSummary(showUrl, query))
});

apisRouter.put('/lockers', (req, res) => {
  const { id, item, options = {} } = adaptParseBody(req) as { id?: string, item: any, options: LockerOptions }
  res.type('application/json')
  try {
    if (typeof id === 'string') {
      res.send(lockerManager.putItem(id, item, options?.privateKey))
    } else {
      res.send(lockerManager.addItem(item, options))
    }
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message })
  }
});

apisRouter.post('/lockers', (req, res) => {
  const { id, options = {} } = adaptParseBody(req) as { id: string, options: LockerOptions }
  res.type('application/json')
  try {
    res.send(lockerManager.getItem(id, options?.privateKey))
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message })
  }
});

apisRouter.delete('/lockers', (req, res) => {
  const { id } = adaptParseBody(req) as { id: string }
  res.type('application/json')
  try {
    res.send(lockerManager.destroyItem(id))
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message })
  }
});

apisRouter.post('/wakeup', (req, res) => {
  res.send('OK');
});

const started = Date.now()
apisRouter.get('/started', (req, res) => {
  res.send({ t: started });
});

export default apisRouter
