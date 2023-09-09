import express from 'express';
import adaptParseBody from './utils/adaptParseBody.js';
import dcBot from './services/dc-bot/index.js';

const adminApisRouter = express.Router();

function getAllLayerRegexp() {
  return adminApisRouter.stack.slice(1).map(l => l.regexp) as RegExp[]
}

// Check Password
adminApisRouter.use('*', (req, res, next) => {
  const { passwd } = req.body;
  for (const layerRegexp of getAllLayerRegexp()) {
    if (layerRegexp.test(req.baseUrl)) {
      if (passwd !== process.env.ADMIN_PASSWORD) {
        res.send('Incorrect password')
        return
      }
    }
  }
  next()
})

adminApisRouter.use('/admin-test', (req, res) => {
  res.send('OK YES')
})

adminApisRouter.post('/config', (req, res) => {
  const { name, value } = adaptParseBody(req);
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

export default adminApisRouter;
