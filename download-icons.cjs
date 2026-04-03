const https = require('https');
const fs = require('fs');

https.get('https://placehold.co/192x192/6366f1/ffffff/png?text=M', (res) => {
  res.pipe(fs.createWriteStream('public/icon-192.png'));
});

https.get('https://placehold.co/512x512/6366f1/ffffff/png?text=M', (res) => {
  res.pipe(fs.createWriteStream('public/icon-512.png'));
});
