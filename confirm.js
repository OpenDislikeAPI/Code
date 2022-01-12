const crypto = require('crypto')
const fs = require('fs')
const path = require('path');
const { msToSec } = require('@sentry/tracing/dist/utils');
const enc_key = process.env.ENC_KEY
const client_secret = process.env.CLIENT_SECRET
const rsa_private_key = process.env.RSA_ENC
const pubKeyObject = crypto.createPublicKey({
    key: rsa_private_key,
    format: 'pem'
})

const publicKey = pubKeyObject.export({
    format: 'pem',
    type: 'spki'
})

console.log(`Running with Secret From '${enc_key.split(':')[0]}'\nHash (encoded hex): '${crypto.createHash('sha256').update(enc_key[1]).digest('hex')}'\n`)

console.log(`Running with Client Secret From 'hrichik' (ofc, the client would be always mine) \nNotHash (human readable english text): 'not need to show cause it is my secret hahahahahahaha (useless to show anyways)'\n`)

console.log(`Running with RSA Private Key From 'some-guy-currently-me-but-in-future-it-maybe-lmg-or-someone-will-update-here'\nPublic key: '${publicKey}'`)

console.log('would deploy after 3 seconds')
setTimeout(() => {
    console.log("3 seconds have passed")
    console.log("Deploy has been resumed")
}, 3000);
