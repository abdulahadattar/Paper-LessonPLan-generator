
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/fetch-pdf', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer.toString('base64'));
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).send('Failed to fetch PDF');
  }
});

// This conditional prevents the server from starting during tests
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
