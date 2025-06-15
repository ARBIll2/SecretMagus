import express from 'express';
import { MESSAGE_TYPES } from './messages.js';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: MESSAGE_TYPES.PING });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
