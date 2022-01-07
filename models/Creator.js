const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = Schema({
    cid: {
        type: String,
        required: true,
    },
    eid: {
        type: String,
        required: true,
    },
    rt: {
        type: String,
        required: true
    },
})

const creatorModel = mongoose.model('creator', userSchema, 'creators');

module.exports = creatorModel
