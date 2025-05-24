// Unique change: This comment was added for deployment/versioning test purposes.
const axios = require('axios');

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

  // Fetch Infobip credentials from your Funifier DB
  const credsResp = await axios.get(
    'https://service2.funifier.com/v3/database/integration_secrets__c?q=_id:\'infobip_sms\'',
    { headers: { Authorization: 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==' } }
  );
  const creds = credsResp.data && credsResp.data[0];
  if (!creds || !creds.apiKey || !creds.baseUrl || !creds.sender) {
    res.status(500).json({ error: 'Infobip credentials not found' });
    return;
  }

  try {
    const smsResp = await axios.post(
      `https://${creds.baseUrl}/sms/2/text/advanced`,
      {
        messages: [
          {
            from: creds.sender,
            destinations: [{ to }],
            text: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `App ${creds.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.status(200).json({ success: true, messageId: smsResp.data.messages[0].messageId });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.requestError?.serviceException?.text || err.message });
  }
}; 