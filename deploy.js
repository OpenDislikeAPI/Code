const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const enc_key = process.env.ENC_KEY
const client_secret = process.env.CLIENT_SECRET
const rsa_private_key = process.env.RSA_ENC

const deploy_id = crypto.createHash('sha256').update(crypto.randomBytes(256)).digest('base64');
console.log(`This deploy has been ID'd as '${deploy_id}'`);

console.log(`Writing Secrets to file`);
fs.writeFileSync(path.join(__dirname, 'deploy_id'), deploy_id);
fs.writeFileSync(path.join(__dirname, 'config', 'key'), enc_key);
fs.writeFileSync(path.join(__dirname, 'config', 'client_secret'), client_secret);
fs.writeFileSync(path.join(__dirname, 'config', 'private.pem'), rsa_private_key);
console.log(`Secrets written to file`);
