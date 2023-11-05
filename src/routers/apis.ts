import path from 'path';
import express from 'express';
import translate from '@saipulanuar/google-translate-api';
import adaptParseBody from '../utils/adaptParseBody';
import type { LockerOptions } from '../services/lockers';
import lockerManager from '../services/lockers';
import { ddgSearch, ddgSearchSummary, googleSearch, googleSearchSummary } from '../services/search';
import { convertCurrency, getCurrencyList } from '../services/currency'
import ls from '../services/ls';
import yadisk from '../services/yadisk';

const apisRouter = express.Router();

apisRouter.use('/', express.static('public/'));

apisRouter.get('/', (req, res) => {
  res.send({ t: Date.now() });
});

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

apisRouter.use('/translate', async (req, res) => {
  const { text, from, to } = adaptParseBody(req);
  res.type('application/json');
  try {
    res.status(200).send(await translate(text, { from, to }));
  } catch (error) {
    res.send({ err: error });
  }
});

apisRouter.use('/google-search', async (req, res) => {
  const { query } = adaptParseBody(req);
  if (!query) return res.status(400).send({ error: 'Invalid body' });
  res.send(await googleSearch(query));
});

apisRouter.use('/ddg-search', async (req, res) => {
  const { query } = adaptParseBody(req);
  if (!query) return res.status(400).send({ error: 'Invalid body' });
  res.send(await ddgSearch(query));
});

apisRouter.use('/google-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req);
  if (!query) return res.status(400).send({ error: 'Invalid body' });
  res.type('text/plain');
  res.send(await googleSearchSummary(showUrl, query));
});

apisRouter.use('/ddg-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req);
  if (!query) return res.status(400).send({ error: 'Invalid body' });
  res.type('text/plain');
  res.send(await ddgSearchSummary(showUrl, query));
});

apisRouter.put('/lockers', (req, res) => {
  const { id, item, options = {} } = adaptParseBody(req) as { id?: string, item: any, options: LockerOptions };
  res.type('application/json');
  try {
    if (typeof id === 'string') res.send(lockerManager.putItem(id, item, options?.privateKey));
    else res.send(lockerManager.addItem(item, options));
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});

apisRouter.post('/lockers', (req, res) => {
  const { id, options = {} } = adaptParseBody(req) as { id: string, options: LockerOptions };
  res.type('application/json');
  try {
    res.send(lockerManager.getItem(id, options?.privateKey));
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});

apisRouter.delete('/lockers', (req, res) => {
  const { id } = adaptParseBody(req) as { id: string };
  res.type('application/json');
  try {
    res.send(lockerManager.destroyItem(id));
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message });
  }
});

apisRouter.get('/ls/list', (req, res) => {
  res.type('application/json');
  try {
    res.send(ls.list);
  } catch (err) {
    res.status(500).send(`${err}`);
  }
});

apisRouter.get('/ls/:fn', (req, res) => {
  res.type('application/json');
  try {
    res.send(ls.get(req.params.fn));
  } catch (err) {
    res.status(404).send(`Not Found`);
  }
});

apisRouter.get('/ls/i/:id', async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    const download = (req.query.download || req.query.dl || 0).toString() != '0';
    if (!id) throw 'NOT FOUND';
    const resource = await yadisk.preview(`https://yadi.sk/i/${id}`);
    res.setHeader('Content-Disposition', `${download ? 'attachment; ' : ''}filename="${resource.filename}"`);
    res.type(resource.type);
    if (resource.started) res.send(await resource.data);
    else resource.stream.pipe(res);
  } catch (err) {
    res.status(404).send(`Not Found`);
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
