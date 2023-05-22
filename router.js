const express = require('express');
const { app } = require('.');
const googlethis = require('googlethis');


app.use('/static/', express.static('static/'));

app.get('/', (req, res) => {
  res.send(Date.now().toString());
});

app.get('/ip', (req, res) => {
  res.send({
    ip: req.ip
      || req.headers['x-real-ip']
      || req.headers['x-forwarded-for'] 
      || req?.connection?.remoteAddress
      || req.socket.remoteAddress
  });
});

app.use('/googlethis', async (req, res) => {
  const query = req.body.query || req.query.query
  const pretty = req.body.pretty || req.query.pretty
  const result = await googlethis.search(query)
  res.type('application/json')
  res.send(pretty ? JSON.stringify(result, null, 4) : result)
});

app.post('/wakeup', (req, res) => {
  res.send('OK');
});