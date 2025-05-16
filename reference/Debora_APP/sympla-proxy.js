// Proxy simples para Sympla API
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = 3001;
const SYMPLA_TOKEN = '49d0402fa2cca0ddabcaafef2c33cd4bbe9446f5a0b78115038f18265a1530db';

app.use(cors()); // Permite CORS para o front-end

// Lista de eventos
app.get('/events', async (req, res) => {
  try {
    const r = await fetch('https://api.sympla.com.br/public/v1.5.1/events', {
      headers: { 's_token': SYMPLA_TOKEN }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar eventos do Sympla.' });
  }
});

// Detalhe de evento
app.get('/events/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.sympla.com.br/public/v1.5.1/events/${req.params.id}`, {
      headers: { 's_token': SYMPLA_TOKEN }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar detalhes do evento.' });
  }
});

app.listen(PORT, () => console.log('Sympla proxy rodando em http://localhost:' + PORT));
