// index.js
const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});


app.get('/', (req, res) => {
  res.send('✅ API de descarga de YouTube MP3 activa.');
});


app.get('/download-mp3', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Falta el parámetro de URL.' });
  }

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: 'URL de YouTube no válida.' });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .trim();

    res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    }).pipe(res);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: 'Ocurrió un error al descargar el audio.',
      details: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});