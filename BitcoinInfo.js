                         
var fs = require("fs")
var proto = require("proto")
var rp = require('request-promise')
var Promise = require('bluebird')

var msDelay = 100
var timestamp = Date.now();

module.exports = proto(function() {

    this.latestBlock = function() {
        var that = this

        if(fs.existsSync('./testBlockHash')) {
            return this.getBlock(JSON.parse(fs.readFileSync('./testBlockHash')))
        } else {
            return jsonReq('https://blockchain.info/latestblock').then(function(latestBlockInfo) {
                fs.writeFileSync('./testBlockHash', JSON.stringify(latestBlockInfo.hash))
                return that.getBlock(latestBlockInfo.hash)
            })
        }
    }

    this.getBlock = function(hash) {
        // if(fs.existsSync('./blocks/'+hash)) {
        //     var next = Promise.resolve(JSON.parse(fs.readFileSync('./blocks/'+hash)))
        // } else {
            var next = jsonReq('https://blockchain.info/rawblock/'+hash).then(function(blockInfo) {
                // fs.writeFileSync('./blocks/'+hash, JSON.stringify(blockInfo))
                return blockInfo
            })
        // }

        return next.then(function(blockInfo) {
            return Block(blockInfo)
        })
    }

    this.getTransaction = function(txId) {
        return jsonReq('https://blockchain.info/rawtx/'+txId).then(function(tx) {
            return Transaction(tx)
        })
    }

    // .then(function(block) {
    //     return Promise.all(block.transactions.map(function(tx) {
    //         return b.getTransaction(tx)
})

var Block = proto(function() {
    this.init = function(blockInfo) {
        var that = this

        this.height = blockInfo.height
        this.hash = blockInfo.hash
        this.time = blockInfo.time
        this.prev = blockInfo.prev_block
        this.size = blockInfo.size
        this.fee = blockInfo.fee

        that.transactions = blockInfo.tx.slice(1).map(function(tx) {   // slice off first transaction (the coinbase)
            return Transaction(tx)
        })
    }
})

var Transaction = proto(function() {
    this.init = function(txInfo) {
        var that = this

        that.id = txInfo.hash
        that.index = txInfo.tx_index
        that.size = txInfo.size
        that.weight = txInfo.weight
        that.inputs = txInfo.inputs
        that.outputs = txInfo.out
        that.segwit = this.isSegwit()
        that.fee = this.getFee(txInfo)

        // console.log(that)
    }

    this.getFee = function() {
        // console.log("Input value: "+getTransactionInputsValue(this)+', output value: '+getTransactionOutputsValue(this))
        return getTransactionInputsValue(this)-getTransactionOutputsValue(this)
    }

    this.isSegwit = function() {
        return this.inputs.reduce(function(acc, b) {
            return acc && !!b.witness
        }, true)
    }
})

function getTransactionInputsValue(tx) {
    return tx.inputs.reduce(function(acc, input){
        return acc + input.prev_out.value
    },0)
}
function getTransactionOutputsValue(tx) {
    return tx.outputs.reduce(function(acc, output){
        return acc + output.value
    },0)
}

function delay(ms) {
    var now = Date.now();
    ms -= now - timestamp;
    timestamp = now;
    if(ms <= 0) {
        return Promise.resolve(true);
    }
    else {
        return Promise.delay(ms);
    }
}

function jsonReq(url, bDelay) {
    var bDelay = (typeof bDelay !== 'undefined') ?  bDelay  : true;
    ms = (bDelay) ? msDelay : 0;
    return delay(ms).then(function(nothing) {
        return rp({
            uri: url,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true
        })
    })
}