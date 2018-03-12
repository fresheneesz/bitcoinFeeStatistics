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

var analysisInfoFormatVersion = '1.2.0'  // should change anytime things are added to the stored feeInfo files

var hoursToLookBack =  12//24*3
var blocksToLookBack = hoursToLookBack*6 // ~6 blocks per hour

getLastXAnalysisInfo(blocksToLookBack).then(function(analysisInfoObjects) {
    var combinedAnalysisInfo = combineBlockStatistics(analysisInfoObjects)
    var cai = combinedAnalysisInfo

    var timeDiff = cai.block.timeRange[1] - cai.block.timeRange[0]
    if(timeDiff/60/60 > 32) {
        var timeLengthString = (Math.round(10*timeDiff/60/60/24)/10)+' days'
    } else {
        var timeLengthString = Math.round(timeDiff/60/60)+' hours'
    }

    console.log("Block heights "+cai.block.heightRange[0]+"-"+cai.block.heightRange[1]+': '+
            timeLengthString+' ('+timeFormat(cai.block.timeRange[0])+' - '+timeFormat(cai.block.timeRange[1])+')'
    )
    var segwitTransactions = cai.sortedSegwitFeeRates, legacyTransactions = cai.sortedLegacyFeeRates

    var segwitFraction = (segwitTransactions.length+1)/(segwitTransactions.length+legacyTransactions.length+2)
    console.log(Math.round(segwitFraction*100)+'% segwit transactions ('+(segwitTransactions.length+1)+'/'+(segwitTransactions.length+legacyTransactions.length+2)+')')

    // transaction count estimates taking batching into account
    var segwitTxEstimate = segwitTransactions.length+cai.segwitBatchOutputsSum-cai.segwitBatchedTxs
    var legacyTxEstimate = legacyTransactions.length+cai.legacyBatchOutputsSum-cai.legacyBatchedTxs

    var totalBatchOutputs = cai.segwitBatchOutputsSum + cai.legacyBatchOutputsSum// minus change output

    console.log(Math.round(totalBatchOutputs*100/(segwitTxEstimate+legacyTxEstimate))+'% transactions batched (estimated) ('+(totalBatchOutputs)+'/'+(segwitTxEstimate+legacyTxEstimate)+')')

    var feePerBatchedTx = (cai.legacyBatchTxFeeSum+cai.segwitBatchTxFeeSum)/(cai.legacyBatchTxSizeSum+cai.segwitBatchTxSizeSum)
    console.log("Avg fee per batch payment: "+renderPrecision(feePerBatchedTx,1)+' sat/byte')
    console.log("Avg size per batch payment: "+renderPrecision((cai.legacyBatchTxSizeSum+cai.segwitBatchTxSizeSum)/totalBatchOutputs,1)+' bytes')

    console.log("CPFPs found: "+combinedAnalysisInfo.cpfpCount)
    console.log()

    // console.log("Mean fee: "+Math.round(mean(legacyTransactions.concat(segwitTransactions)))+' sat/byte')

    var segwitStats = renderTransactionStats(segwitTransactions)
    var legacyStats = renderTransactionStats(legacyTransactions)

    console.log("\t\t\t\tSegwit\t\tLegacy")
    console.log("Min fee: \t\t\t"+segwitStats.min+'\t\t'+legacyStats.min+'\tsat/byte')
    console.log("0.1 percentile fee: \t\t"+segwitStats.p1+'\t\t'+legacyStats.p1+'\tsat/byte')
    console.log("1 percentile fee: \t\t"+segwitStats.one+'\t\t'+legacyStats.one+'\tsat/byte')
    console.log("10th percentile fee: \t\t"+segwitStats.ten+'\t\t'+legacyStats.ten+'\tsat/byte')
    console.log("50th percentile fee (median): \t"+segwitStats.fifty+'\t\t'+legacyStats.fifty+'\tsat/byte')
    console.log("Mean fee: \t\t\t"+segwitStats.mean+'\t\t'+legacyStats.mean+'\tsat/byte')

    for(var k in segwitStats.feeCounts) {
        var segwitCount = segwitStats.feeCounts[k]
        var legacyCount = legacyStats.feeCounts[k]
        var segwitPercent = renderPrecision(100*segwitCount/segwitTransactions.length,1)
        var legacyPercent = renderPrecision(100*legacyCount/legacyTransactions.length,1)
        var tabs = '\t\t\t'
        if(k.length >= 5) tabs = '\t\t'

        var segwitStat = segwitPercent+'% ('+segwitCount+')'
        var afterTabs = '\t'
        if(segwitStat.length < 8) afterTabs = '\t\t'
        console.log(k+" sat/byte: "+tabs+segwitStat+afterTabs+legacyPercent+'% ('+legacyCount+')\ttransactions')
    }

    console.log("Batch Transactions: \t\t"+cai.segwitBatchedTxs+'\t\t'+cai.legacyBatchedTxs+'\t\ttransactions')
    console.log("Avg payments per batch: \t"+renderPrecision(cai.segwitBatchOutputsSum/cai.segwitBatchedTxs,1)+'\t\t'
        +renderPrecision(cai.legacyBatchOutputsSum/cai.legacyBatchedTxs,1)+'\t\tbatched-payments/batch'
    )
    console.log("Estimated % batched payments: \t"+renderPrecision(100*cai.segwitBatchOutputsSum/segwitTxEstimate, 1)+'%\t\t'
        + renderPrecision(100*cai.legacyBatchOutputsSum/legacyTxEstimate, 1)+'%'
    )
    console.log("Avg fee per batched payment: \t"+renderPrecision(cai.segwitBatchTxFeeSum/cai.segwitBatchTxSizeSum,1)+'\t\t'
        +renderPrecision(cai.legacyBatchTxFeeSum/cai.legacyBatchTxSizeSum,1)+'\t\tsat/byte'
    )
    console.log("Median fee per batched payment: "+renderPrecision(segwitStats.batchMedian,1)+'\t\t'
        +renderPrecision(legacyStats.batchMedian,1)+'\t\tsat/byte'
    )
    console.log("Avg size per batched payment: \t"+renderPrecision(cai.segwitBatchTxSizeSum/cai.segwitBatchOutputsSum,1)+'\t\t'
        +renderPrecision(cai.legacyBatchTxSizeSum/cai.legacyBatchOutputsSum,1)+'\t\tbytes/payment'
    )
})

function renderTransactionStats(transactionInfoObjects) {
    var p = function(n) {
        return renderPrecision(n,1)
    }

    var feeCounts = calcFeeCounts(transactionInfoObjects)

    var batchTransactions = transactionInfoObjects.filter(function(info){
        return info.outputCount > 2
    })

    return {
        min: p(transactionInfoObjects[0].feePerByte),
        p1: p(percentile(transactionInfoObjects, .001)),
        one: p(percentile(transactionInfoObjects, .01)),
        ten: p(percentile(transactionInfoObjects, .1)),
        fifty: p(percentile(transactionInfoObjects, .5)),
        mean: p(mean(transactionInfoObjects)),
        feeCounts: feeCounts,
        batchMedian: percentile(batchTransactions,.5)
    }
}
function calcFeeCounts(transactionInfoObjects) {
    var result = {
        '0-5': 0,
        '5-10': 0,
        '10-15': 0,
        '15-20': 0,
        '20-50': 0,
        '50-100': 0,
        '100-200': 0,
        '200-500': 0,
        '500+': 0
    }

    transactionInfoObjects.forEach(function(tx) {
        if(tx.feePerByte <= 5)
            result['0-5']++
        else if(5 < tx.feePerByte&&tx.feePerByte <= 10)
            result['5-10']++
        else if(10 < tx.feePerByte&&tx.feePerByte <= 15)
            result['10-15']++
        else if(15 < tx.feePerByte&&tx.feePerByte <= 20)
            result['15-20']++
        else if(20 < tx.feePerByte&&tx.feePerByte <= 50)
            result['20-50']++
        else if(50 < tx.feePerByte&&tx.feePerByte <= 100)
            result['50-100']++
        else if(100 < tx.feePerByte&&tx.feePerByte <= 200)
            result['100-200']++
        else if(200 < tx.feePerByte&&tx.feePerByte <= 500)
            result['200-500']++
        else if(500 < tx.feePerByte)
            result['500+']++
    })

    return result
}

function renderPrecision(number, precision) {
    var multiplier = Math.pow(10,precision)
    return Math.round(multiplier*number)/multiplier
}

// reverseSortedBlocks - blocks sorted by newest first
function combineBlockStatistics(reverseSortedAnalyzationInfo) {
    var result = reverseSortedAnalyzationInfo.reduce(function(acc, feeInfo) {
        acc.block.heightRange[0]=feeInfo.block.height
        acc.block.timeRange[0]=feeInfo.block.time
        acc.cpfpCount += feeInfo.cpfpCount
        acc.sortedSegwitFeeRates = acc.sortedSegwitFeeRates.concat(feeInfo.segwitFeeRates)
        acc.sortedLegacyFeeRates = acc.sortedLegacyFeeRates.concat(feeInfo.legacyFeeRates)

        function findBatchInfo(transactions) {
            var batchOutputsSum = 0, batchedTxs = 0, batchTxFeeSum = 0, batchTxSizeSum = 0
            transactions.forEach(function(t) {
                if(t.outputCount > 2* t.groupTxCount) {
                    batchOutputsSum += t.outputCount - 2*t.groupTxCount
                    batchedTxs++
                    batchTxFeeSum += t.feePerByte*t.groupSize
                    batchTxSizeSum += t.groupSize
                }
            })

            return {
                batchedTxs:batchedTxs, batchOutputsSum:batchOutputsSum,
                batchTxFeeSum:batchTxFeeSum, batchTxSizeSum:batchTxSizeSum
            }
        }

        var segwitBatchInfo = findBatchInfo(feeInfo.segwitFeeRates)
        var legacyBatchInfo = findBatchInfo(feeInfo.legacyFeeRates)

        acc.segwitBatchedTxs += segwitBatchInfo.batchedTxs
        acc.legacyBatchedTxs += legacyBatchInfo.batchedTxs
        acc.segwitBatchOutputsSum += segwitBatchInfo.batchOutputsSum
        acc.legacyBatchOutputsSum += legacyBatchInfo.batchOutputsSum

        acc.segwitBatchTxFeeSum += segwitBatchInfo.batchTxFeeSum
        acc.legacyBatchTxFeeSum += legacyBatchInfo.batchTxFeeSum
        acc.segwitBatchTxSizeSum += segwitBatchInfo.batchTxSizeSum
        acc.legacyBatchTxSizeSum += legacyBatchInfo.batchTxSizeSum

        if(feeInfo.outputCount > 2) {
            acc.batchedTxs++
            acc.batchOutputsSum += feeInfo.outputCount-1
        }

        return acc
    }, {
        block: {
            heightRange: [0, reverseSortedAnalyzationInfo[0].block.height],
            timeRange: [0, reverseSortedAnalyzationInfo[0].block.time]
        },
        cpfpCount: 0,
        sortedSegwitFeeRates: [],
        sortedLegacyFeeRates: [],
        segwitBatchedTxs: 0, legacyBatchedTxs: 0,
        segwitBatchOutputsSum:0, legacyBatchOutputsSum:0,
        segwitBatchTxFeeSum:0, legacyBatchTxFeeSum:0,
        segwitBatchTxSizeSum:0, legacyBatchTxSizeSum:0

    })

    result.sortedSegwitFeeRates.sort(function(a,b) {return a.feePerByte-b.feePerByte})
    result.sortedLegacyFeeRates.sort(function(a,b) {return a.feePerByte-b.feePerByte})
    return result
}

function getLastXAnalysisInfo(x) {
    return b.latestBlockHash().then(function(hash) {
//        hash = '00000000000000000023b2097fec2e7052b0fad91ecad3f374afbc352da7df08'
        return getLastXBlockAnalysisInfo({block:{prev:hash}}, x)
    })
}

function getLastXBlockAnalysisInfo(curAnalysisInfo, x, total) {
    if(total === undefined) total = x
    process.stdout.write('\r'+x+'/'+total+' blocks left to download      ')
    return getBlockAnalysisInfo(curAnalysisInfo.block.prev).then(function(analysisInfo) {
        if(x > 1) {
            return getLastXBlockAnalysisInfo(analysisInfo, x-1, total).then(function(prevAnalysisInfo) {
                return [analysisInfo].concat(prevAnalysisInfo)
            }).catch(function(e) {
                console.error(e.message)
                return [analysisInfo]
            })
        } else {
            return [analysisInfo]
        }
    }).then(function(x) {
        if(total !== x) process.stdout.write('\r0 blocks left to download     \r')
        return x
    }).catch(function(e) {
        console.error(e.message)
        return [curAnalysisInfo]
    })
}

function getBlockAnalysisInfo(hash) {
    if(fs.existsSync('./blockAnalysisInfo/'+hash)) {
        var blockFeeInfo = JSON.parse(fs.readFileSync('./blockAnalysisInfo/'+hash))
        if(blockFeeInfo.version === analysisInfoFormatVersion) {
            return Promise.resolve(blockFeeInfo)
        } else {
            return getNewBlockFeeInfo()
        }

    } else {
        return getNewBlockFeeInfo()
    }

    function getNewBlockFeeInfo() {
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
        var groupFee=0, groupSize=0, segwit = true, outputCount=0
        group.forEach(function(transaction) {
            groupFee += transaction.fee
            groupSize += transaction.size
            segwit = segwit && transaction.segwit
            outputCount += transaction.outputs.length
        })

        var feePerByte = groupFee/groupSize
        if(segwit) {
            var txSet = segwitTransactions
        } else {
            var txSet = legacyTransactions
        }

        txSet.push({
            feePerByte:feePerByte,//, group:group
            outputCount: outputCount,
            groupTxCount: group.length,
            groupSize: groupSize // in bytes
        })
    })

    return {
        version: analysisInfoFormatVersion,
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
    var percentileIndex = getPercentileIndex(sortedTransactionFees, percentile)
    // console.log(percentileIndex+'/'+sortedTransactionFees.length)
    return sortedTransactionFees[percentileIndex].feePerByte
}
function getPercentileIndex(sortedTransactionFees, percentile) {
    return Math.floor(sortedTransactionFees.length * percentile)
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
