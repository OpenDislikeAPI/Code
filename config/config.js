const fs = require('fs');
const path = require('path');
const crypto = require('crypto')
var enc_key = ''
var client_secret = ''
var rsa_private_key = ''

if(process.env.NODE_ENV === 'production'){
    const fl = fs.readFileSync(path.join(__dirname, 'key'), 'utf8');

    console.log(`Running with Secret From ${fl.split('::')[0]}\nHash: ${crypto.createHash('sha256').update(fl[1]).digest('base64')}`)

    enc_key = fl.split('::')[1].trim();

    const clientsecret = fs.readFileSync(path.join(__dirname, 'client_secret'), 'utf8');

    client_secret = clientsecret.trim();

    const rsa_private_key_file = fs.readFileSync(path.join(__dirname, 'private.pem'), 'utf8');

    rsa_private_key = rsa_private_key_file;
}else{

    const fl = fs.readFileSync(path.join(__dirname, 'keydev'), 'utf8');

    console.log(`Running with Secret From ${fl.split('::')[0]}\nHash: ${crypto.createHash('sha256').update(fl[1]).digest('base64')}`);

    enc_key = fl.split('::')[1].trim();

    const clientsecret = fs.readFileSync(path.join(__dirname, 'client_secretdev'), 'utf8');

    client_secret = clientsecret.trim();

    const rsa_private_key_file = fs.readFileSync(path.join(__dirname, 'private.pemdev'), 'utf8');

    rsa_private_key = rsa_private_key_file;
    
}

    module.exports = {
        // The secret should be set to a non-guessable string that
        // is used to compute a session hash
        'enc': enc_key,
        'client_secret': client_secret,
        'rsa_private_key': rsa_private_key
    }