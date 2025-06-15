import express from 'express';
import { MESSAGE_TYPES } from './messages.js';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: MESSAGE_TYPES.PING });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
