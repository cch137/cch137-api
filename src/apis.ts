import path from 'path';
import express, { Request, Response } from 'express';
import googlethis from 'googlethis';
import { app } from './server.js';
import getIp from './utils/getIp.js';
import adaptParseBody from './utils/adaptParseBody';
import translate from '@saipulanuar/google-translate-api'
import ipManager from './services/ips';
import type { LockerOptions } from './services/lockers';
import lockerManager from './services/lockers';
import dcBot from './services/dc-bot';
import { ddgSearch, ddgSearchSummary, googleSearch, googleSearchSummary } from './services/search';

app.use('/', express.static('public/'));

app.get('/', (req, res) => {
  res.send({ t: Date.now() });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../pages/dashboard.html'));
});

app.post('/config', (req, res) => {
  const { passwd, name, value } = adaptParseBody(req);
  if (passwd !== process.env.ADMIN_PASSWORD) {
    res.send('Incorrect password')
    return
  }
  switch (name) {
    case 'dc-bot':
      if (typeof value !== 'boolean') {
        res.send('Invalid value')
        return
      }
      if (value) {
        dcBot.connect()
      } else {
        dcBot.disconnect()
      }
      res.send('OK')
      return
  }
  res.send('Unknown Action')
});

app.get('/ip', (req, res) => {
  res.send({ ip: getIp(req) });
});

((handle) => {
  app.use('/ip-location', handle);
  app.use('/ip-loc', handle);
})(async (req: Request, res: Response) => {
  const { ip, latest } = adaptParseBody(req)
  try {
    res.send(await ipManager.getIpLocation(ip || getIp(req), latest));
  } catch (error) {
    res.send({ error: 1 });
  }
});

app.use('/translate', async (req, res) => {
  const { text, from, to } = adaptParseBody(req)
  res.type('application/json')
  try {
    res.status(200).send(await translate(text, { from, to }))
  } catch (err) {
    res.send({ err })
  }
});

app.use('/googlethis', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search\'' })
});

app.use('/googleresult', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search-summary\'' })
});

app.use('/google-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await googleSearch(query))
});

app.use('/ddg-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await ddgSearch(query))
});

app.use('/google-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await googleSearchSummary(showUrl, query))
});

app.use('/ddg-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await ddgSearchSummary(showUrl, query))
});

app.put('/lockers', (req, res) => {
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

app.post('/lockers', (req, res) => {
  const { id, options = {} } = adaptParseBody(req) as { id: string, options: LockerOptions }
  res.type('application/json')
  try {
    res.send(lockerManager.getItem(id, options?.privateKey))
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message })
  }
});

app.delete('/lockers', (req, res) => {
  const { id } = adaptParseBody(req) as { id: string }
  res.type('application/json')
  try {
    res.send(lockerManager.destroyItem(id))
  } catch (err) {
    res.status(400).send({ name: (err as Error)?.name, message: (err as Error)?.message })
  }
});

app.post('/wakeup', (req, res) => {
  res.send('OK');
});

const started = Date.now()
app.get('/started', (req, res) => {
  res.send({ t: started });
});

export default () => true
