import path from 'path';
import express, { Request, Response } from 'express';
import googlethis from 'googlethis';
import { app } from './server.js';
import getIp from './utils/getIp.js';
import adaptParseBody from './utils/adaptParseBody';
import translate from '@saipulanuar/google-translate-api'
import ipManager from './services/ips';
// import lockerManager from './services/lockers';
import dcBot from './services/dc-bot/index.js';

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
  const { query, pretty } = adaptParseBody(req)
  if (!query) {
    return res.status(400).send({ error: 'Invalid body' })
  }
  const result = await googlethis.search(query)
  res.type('application/json')
  res.send(pretty ? JSON.stringify(result, null, 4) : result)
});

app.use('/googleresult', async (req, res) => {
  const { query, showUrl } = adaptParseBody(req)
  if (!query) {
    return res.status(400).send({ error: 'Invalid body' })
  }
  const searched = await googlethis.search(query)
  const results = [...searched.results, ...searched.top_stories] as { title?: string, description: string, url: string }[]
  res.type('text/plain')
  res.send([...new Set(results
    .map((r) => `${showUrl ? r.url : ''}\n${r.title ? r.title : ''}\n${r.description}`))
  ].join('\n\n'))
});

app.post('/wakeup', (req, res) => {
  res.send('OK');
});

const started = Date.now()
app.get('/started', (req, res) => {
  res.send({ t: started });
});

export default () => true
