/* eslint global-require: "off" */
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import helmet from 'helmet';

import trainingExample from './endpoints/trainingExample';

const app = express();
app.enable('trust proxy');
app.use(helmet());

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// point to client build folder
const staticFiles = express.static(path.join(__dirname, '../../client/build'));
app.use(staticFiles);

app.use('/api/trainingExample', trainingExample);

// MAIN
app.use('/*', staticFiles);

// Basic 404 handler
app.use((req, res) => {
  res.status(404).json({ body: 'Not Found', internalCode: 404 });
});

// Basic error handler
// note: ``next`` parameter is necessary for proper error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  /* jshint unused:false */
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).json(err.response || 'Something broke!');
});

const server = app.listen(process.env.PORT || 4501, () => {
  const { port } = server.address();
  console.log(`App listening on port ${port}`);
});
