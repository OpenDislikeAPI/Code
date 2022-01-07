const fs = require('fs');
const path = require('path');

var enc_key = ''
var client_secret = ''

if(process.env.NODE_ENV === 'production'){
    const enckey = fs.readFileSync(path.join(__dirname, 'key'), 'utf8');
    const clientsecret = fs.readFileSync(path.join(__dirname, 'client_secret'), 'utf8');
    client_secret = clientsecret.trim();
    enc_key = enckey.trim();
}else{
    const enckey = fs.readFileSync(path.join(__dirname, 'keydev'), 'utf8');
    const clientsecret = fs.readFileSync(path.join(__dirname, 'client_secretdev'), 'utf8');
    client_secret = clientsecret.trim();
    enc_key = enckey.trim();
}

    module.exports = {
        // The secret should be set to a non-guessable string that
        // is used to compute a session hash
        'enc': enc_key,
        'client_secret': client_secret,
    }