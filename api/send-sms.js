const Vonage = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { to, message } = req.body;
  if (!to || !message) {
    res.status(400).json({ error: 'Missing to or message' });
    return;
  }

  const from = 'Funifier'; // Or your Vonage virtual number
  vonage.message.sendSms(from, to, message, (err, responseData) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (responseData.messages[0].status !== "0") {
      res.status(500).json({ error: responseData.messages[0]['error-text'] });
    } else {
      res.status(200).json({ success: true, messageId: responseData.messages[0]['message-id'] });
    }
  });
}; 