const https = require('https');

const url = 'https://api.vercel.com/v10/projects/flavio-lucas-projects-ad5e726c/api/env?teamId=team_Uw7vhBuopBVHNUxNGHz56Tc7';

const data = JSON.stringify({
  key: 'TURSO_DATABASE_URL',
  value: 'libsql://portfolio-api-flavio-lucas.aws-us-east-1.turso.io',
  type: 'encrypted',
  target: ['production']
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`
  }
};

const req = https.request(url, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
