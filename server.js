// index.js
const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const port = process.env.PORT || 3000;

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Ruta principal
app.get('/', (req, res) => {
  res.send('✅ API de descarga de YouTube MP3 activa.');
});

// Ruta de descarga MP3
app.get('/download-mp3', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Falta el parámetro ?url=' });
  }

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: 'URL de YouTube no válida.' });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .trim();

    res.header(
      'Content-Disposition',
      `attachment; filename="${videoTitle}.mp3"`
    );
    res.header('Content-Type', 'audio/mpeg');

    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    // Manejo de errores del stream
    stream.on('error', (err) => {
      console.error('⚠️ Error en el stream:', err);
      res.status(500).json({
        error: 'Error en el stream de YouTube',
        details: err.message || err,
        stack: err.stack || null,
      });
    });

    stream.pipe(res);

  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({
      error: 'Error general al procesar el video',
      details: error.message || error,
      stack: error.stack || null,
    });
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});