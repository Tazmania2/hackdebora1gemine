// Unique change: This comment was added for deployment/versioning test purposes.
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { to, message } = req.body;
  if (!to || !message) {
    res.status(400).json({ error: 'Missing to or message parameters' });
    return;
  }

  // Validate phone number format
  if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
    res.status(400).json({ error: 'Invalid phone number format' });
    return;
  }

  try {
    // Use environment variable or fetch from Funifier DB as fallback
    const basicAuth = process.env.FUNIFIER_BASIC_AUTH || 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    
    // Fetch Infobip credentials from your Funifier DB
    const credsResp = await axios.get(
      'https://service2.funifier.com/v3/database/integration_secrets__c?q=_id:\'infobip_sms\'',
      { 
        headers: { Authorization: basicAuth },
        timeout: 10000
      }
    );
    
    const creds = credsResp.data && credsResp.data[0];
    if (!creds || !creds.apiKey || !creds.baseUrl || !creds.sender) {
      res.status(500).json({ error: 'SMS service configuration not found' });
      return;
    }

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
        },
        timeout: 15000
      }
    );
    
    const messageId = smsResp.data.messages && smsResp.data.messages[0] && smsResp.data.messages[0].messageId;
    res.status(200).json({ 
      success: true, 
      messageId: messageId || 'unknown',
      status: smsResp.data.messages[0].status || {}
    });
  } catch (err) {
    let errorMessage = 'Failed to send SMS';
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
    } else if (err.response) {
      errorMessage = err.response.data?.requestError?.serviceException?.text || 
                    err.response.data?.message || 
                    `HTTP ${err.response.status}`;
    } else if (err.request) {
      errorMessage = 'Network error';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}; 