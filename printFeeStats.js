/*
var bitcoin = require('bitcoin-promise')

var c = new bitcoin.Client({
  host: 'localhost',
  port: 8332,
  //ssl: true,
  user: 'a',
  pass: 'a'
});

c.stop()

c.getBlockCount().then(function(count) {
    console.log('count:', count)
    return c.getBlockHash(count)
}).then(function(hash) {
    return c.getBlock(hash)
}).then(function(block) {
    //console.log(block)
    
    block.tx.slice(0, 10).forEach(function(tx, n) {
        c.getRawTransaction(tx).then(function(tx) {
            return c.decodeRawTransaction(tx)
        }).then(function(tx) {
            console.log("#"+n)
            console.log(tx)
            console.log()
        }).catch(function(e) {
            console.log("Couldn't get tx #"+n+' '+tx+': '+e)  
        })
    })
}).catch(function(e) {
    console.log("!!!PROBLEM: "+e)  
})
//*/


var fs = require("fs")
var moment = require('moment')
var BitcoinInfo = require("./BitcoinInfo")

var b = BitcoinInfo()

var hoursToLookBack = 24//24*3
var blocksToLookBack = hoursToLookBack*6 // ~6 blocks per hour

getLastXAnalysisInfo(blocksToLookBack).then(function(analysisInfoObjects) {
    var combinedAnalysisInfo = combineBlockStatistics(analysisInfoObjects)
    var timeDiff = combinedAnalysisInfo.block.timeRange[1] - combinedAnalysisInfo.block.timeRange[0]
    console.log("Block heights "+combinedAnalysisInfo.block.heightRange[0]+"-"+combinedAnalysisInfo.block.heightRange[1]+': '+
            Math.round(timeDiff/60/60)+' hours ('+timeFormat(combinedAnalysisInfo.block.timeRange[0])+' - '+timeFormat(combinedAnalysisInfo.block.timeRange[1])+')'
    )
    var segwitTransactions = combinedAnalysisInfo.sortedSegwitFeeRates, legacyTransactions = combinedAnalysisInfo.sortedLegacyFeeRates

    var segwitFraction = (segwitTransactions.length+1)/(segwitTransactions.length+legacyTransactions.length+2)
    console.log(Math.round(segwitFraction*100)+'% segwit transactions ('+(segwitTransactions.length+1)+'/'+(segwitTransactions.length+legacyTransactions.length+2)+')')
    console.log("CPFPs found: "+combinedAnalysisInfo.cpfpCount)
    console.log()

    // console.log("Mean fee: "+Math.round(mean(legacyTransactions.concat(segwitTransactions)))+' sat/byte')

    console.log("\t\t\t\tSegwit\tLegacy")
    console.log("Min fee: \t\t\t"+Math.round(segwitTransactions[0].feePerByte)+'\t'+Math.round(legacyTransactions[0].feePerByte)+'\tsat/byte')
    console.log("1 percentile fee: \t\t"+Math.round(percentile(segwitTransactions, .01))+'\t'+Math.round(percentile(legacyTransactions, .01))+'\tsat/byte')
    console.log("10th percentile fee: \t\t"+Math.round(percentile(segwitTransactions, .1))+'\t'+Math.round(percentile(legacyTransactions, .1))+'\tsat/byte')
    console.log("50th percentile fee (median): \t"+Math.round(percentile(segwitTransactions, .5))+'\t'+Math.round(percentile(legacyTransactions, .5))+'\tsat/byte')
    console.log("Mean fee: \t\t\t"+Math.round(mean(segwitTransactions))+'\t'+Math.round(mean(legacyTransactions))+'\tsat/byte')
})

// reverseSortedBlocks - blocks sorted by newest first
function combineBlockStatistics(reverseSortedAnalyzationInfo) {
    var result = reverseSortedAnalyzationInfo.reduce(function(acc, feeInfo) {
        acc.block.heightRange[0]=feeInfo.block.height
        acc.block.timeRange[0]=feeInfo.block.time
        acc.cpfpCount += feeInfo.cpfpCount
        acc.sortedSegwitFeeRates = acc.sortedSegwitFeeRates.concat(feeInfo.segwitFeeRates)
        acc.sortedLegacyFeeRates = acc.sortedLegacyFeeRates.concat(feeInfo.legacyFeeRates)

        return acc
    }, {
        block: {
            heightRange: [0, reverseSortedAnalyzationInfo[0].block.height],
            timeRange: [0, reverseSortedAnalyzationInfo[0].block.time]
        },
        cpfpCount: 0,
        sortedSegwitFeeRates: [],
        sortedLegacyFeeRates: []
    })

    result.sortedSegwitFeeRates.sort(function(a,b) {return a.feePerByte-b.feePerByte})
    result.sortedLegacyFeeRates.sort(function(a,b) {return a.feePerByte-b.feePerByte})
    return result
}

function getLastXAnalysisInfo(x) {
    return b.latestBlock().then(function(block) {
        return getLastXBlockAnalysisInfo({block:{prev:block.hash}}, x)
    })
}

function getLastXBlockAnalysisInfo(curAnalysisInfo, x) {
    return getBlockAnalysisInfo(curAnalysisInfo.block.prev).then(function(analysisInfo) {

        process.stdout.write('\r'+(x-1)+' block left to download  ')
        if(x > 1) {
            return getLastXBlockAnalysisInfo(analysisInfo, x-1).then(function(prevAnalysisInfo) {
                return [analysisInfo].concat(prevAnalysisInfo)
            }).catch(function(e) {
                console.error(e.message)
                return [analysisInfo]
            })
        } else {
            return [analysisInfo]
        }
    }).then(function(x) {
        process.stdout.write('\r')
        return x
    })
}

function getBlockAnalysisInfo(hash) {
    if(fs.existsSync('./blockAnalysisInfo/'+hash)) {
        return Promise.resolve(JSON.parse(fs.readFileSync('./blockAnalysisInfo/'+hash)))
    } else {
        return b.getBlock(hash).then(function(block) {
            var feeInfo = analyzeFees(block)
            fs.writeFileSync('./blockAnalysisInfo/'+hash, JSON.stringify(feeInfo))
            return feeInfo
        })
    }
}

function analyzeFees(block) {
    function transactionIsPartOfGroup(group, tx) {
        for(var n=0; n<group.length; n++) {
            var groupTx = group[n]
            if(txInputsIncludeIndex(tx, groupTx.index) || txInputsIncludeIndex(groupTx, tx.index)) { // if they're related
                return true
            }
        }

        return false
    }
    function txInputsIncludeIndex(tx, targetIndex) {
        return tx.inputs.some(function(input) {
            return input.prev_out.tx_index === targetIndex
        })
    }

    // block.transactions = block.transactions.slice(1180, 1190)// REMOVE THIS


    // combine transactions for cases of child-pays-for-parent
    var transactionGroups = []       // each group is a group of transactions where multiple mempool transactions that are chained together are committed to the block all at once (cpfp)
    var cpfpCount=0
    block.transactions.forEach(function(transaction, en) {
        for(var n=0; n<transactionGroups.length; n++) {
            var group = transactionGroups[n]
            if(transactionIsPartOfGroup(group, transaction)) { // if they're related
                group.push(transaction)
                cpfpCount++
                return
            }
        }
        // else
        transactionGroups.push([transaction])
    })

    var segwitTransactions=[], legacyTransactions=[]
    transactionGroups.forEach(function(group) {
        var groupFee=0, groupSize=0, segwit = true
        group.forEach(function(transaction) {
            groupFee += transaction.fee
            groupSize += transaction.size
            segwit = segwit && transaction.segwit
        })

        var feePerByte = groupFee/groupSize
        if(segwit) {
            var txSet = segwitTransactions
        } else {
            var txSet = legacyTransactions
        }

        txSet.push({
            feePerByte:feePerByte//, group:group
        })
    })

    return {
        block: {
            height: block.height,
            time: block.time,
            prev: block.prev
        },
        cpfpCount: cpfpCount,
        segwitFeeRates: segwitTransactions,
        legacyFeeRates: legacyTransactions
    }
}

// sortedTransactions - assumes they're ordered from smallest to largest
function percentile(sortedTransactionFees, percentile) {
    var percentileIndex = Math.floor(sortedTransactionFees.length * percentile)
    // console.log(percentileIndex+'/'+sortedTransactionFees.length)
    return sortedTransactionFees[percentileIndex].feePerByte
}
function mean(transactionFees) {
    var sum = transactionFees.reduce(function(acc,b) {
        return acc+b.feePerByte
    },0)

    return sum/(transactionFees.length-1)
}
function timeFormat(unixTimestampSeconds) {
    return moment.unix(unixTimestampSeconds).format('YYYY-MM-DD HH:mm:ss')
}


/*
var Client = require('bitcoin-core') // https://bitcoin.org/en/developer-reference#bitcoin-core-apis

var c = new Client({

  host: 'localhost',
  port: 8332,
  //ssl: true,
  username: 'a',
  password: 'a'    
})

var feeInfo = {min:Infinity}, failures = 0, successes=0
c.command("GetBlockChainInfo").then(function(info) {
    console.log(info.blocks+'/'+info.headers)
    
    return c.command("GetBlockHash", info.blocks)
}).then(function(hash) {
    return c.command("GetBlock", hash)
}).then(function(block) {
    //console.log(block)
    console.log(new Date(block.time*1000))
    
    var txMap = {}
    block.tx.forEach(function(tx){
        txMap[tx] = 1
    })
    
    var futures = block.tx.map(function(tx, n) {
        return getTransaction(c, tx).catch(function(e) {
            //console.log("Couldn't get tx #"+n+' '+tx+': '+e)  
            failures++
        })
    })
    
    return Promise.all(futures).then(function(transactions) {
        transactions = transactions.filter(function(tx){ // filter out errors
            return tx !== undefined
        })
        
        
        // combine child-pays-for-parent transactions
        var combinedTransactions = {}
        transactions.forEach(function(tx) {
            var cpfpFound;
            tx.vin.forEach(function(input){
                if(input.txid in txMap) 
                    cpfpFound=intut.txid
            })
            if(cpfpFound) {
                if(cpfpFound in combinedTransactions) {
                    combinedTransactions[tx.txid] = combineTransactions(combinedTransactions[cpfpFound], tx)                    
                } else {
                    failures++
                }
                
                delete combinedTransactions[cpfpFound]
            } else {
                combinedTransactions[tx.txid] = tx
            }
                
        })
        
        //console.log("#"+n)
        //console.log(tx)
        
        
            
        if(tx.vin.some(function(input){return input.txid in txMap})) 
            console.log("Child-pays-for-parent detected")
            
        var outputValue = tx.vout.reduce(function(acc, output){
            return acc + output.value
        },0)
            
        return getTransactionInputsValue(c,tx).then(function(inputValue){
            var fee = (inputValue-outputValue)*1000*1000*100
            var feePerByte = fee/tx.vsize
                
            if(feeInfo.min > feePerByte) 
                feeInfo.min = feePerByte
        
            console.log("Fee: "+feePerByte+" sat/byte")
            successes++
        }).catch(function(e){
            throw new Error("Couldn't calculate transaction inputs value: "+e.message)
        })
    }).catch(function(e) {
        //console.log("Couldn't get tx #"+n+' '+tx+': '+e)  
        failures++
    })
}).then(function() {
    console.log("Minimum fee: "+feeInfo.min+" sat/byte")
    console.log("Succeeded to calculate fee for "+successes+'/'+(successes+failures)+" transactions")
})

function getTransactionInputsValue(c, tx) {
    var inputIds = tx.vin.map(function(input) {
        return getTransaction(c, input.txid).then(function(tx) {
            return {tx:tx, vout:input.vout}
        })
    })
    
    return Promise.all(inputIds).then(function(inputs) {
        return inputs.reduce(function(acc, input){
            return acc + input.tx.vout[input.vout].value
        },0)
    })
}

function getTransaction(c, id) {
    return c.command("getRawTransaction", id).then(function(tx) {
        return c.command("decodeRawTransaction", tx)
    })  
}

//*/
