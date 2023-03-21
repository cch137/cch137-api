const { app } = require(".");


app.get('/', (req, res) => {
  res.send(Date.now().toString());
});

app.get('/ip', (req, res) => {
  const ip = req.ip 
    || req.headers['x-real-ip']
    || req.headers['x-forwarded-for'] 
    || req?.connection?.remoteAddress
    || req.socket.remoteAddress;
  res.send(ip || '');
});

app.post('/wakeup', (req, res) => {
  res.send('OK');
});