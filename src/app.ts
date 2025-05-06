import { configDotenv } from 'dotenv';
import express from 'express';
import Rollbar from 'rollbar';

configDotenv();

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
  locals: Rollbar.Locals,
});

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(rollbar.errorHandler());

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
