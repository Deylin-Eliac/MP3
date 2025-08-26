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

    // Stream principal (highestaudio)
    let stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    // Manejo de error en stream
    stream.on('error', (err) => {
      console.error('⚠️ Error en highestaudio:', err.message);

      if (err.message.includes('410')) {
        console.log('🔄 Reintentando con itag 140 (m4a)');

        // Nuevo stream con fallback
        ytdl(videoUrl, { quality: 140 })
          .on('error', (err2) => {
            console.error('❌ Fallback también falló:', err2.message);
            res.status(500).json({
              error: 'Error en fallback (itag 140)',
              details: err2.message,
              stack: err2.stack || null,
            });
          })
          .pipe(res);
      } else {
        res.status(500).json({
          error: 'Error en el stream de YouTube',
          details: err.message,
          stack: err.stack || null,
        });
      }
    });

    stream.pipe(res);

  } catch (error) {
    console.error('❌ Error general:', error.message);
    res.status(500).json({
      error: 'Error general al procesar el video',
      details: error.message,
      stack: error.stack || null,
    });
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});