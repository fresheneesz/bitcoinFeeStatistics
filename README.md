
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks. This uses blockchain.info's api to get block information.

Here's an example of the output

```
293/432 blocks left to download      429 - "Maximum concurrent requests for this endpoint reached. Please try again shortly."
Block heights 513071-513142: 10 hours (2018-03-11 14:07:12 - 2018-03-11 23:58:49)
27% segwit transactions (15614/57541)
61% transactions batched (estimated) (78900/129433)
Avg fee per batched transaction: 34.5 sat/byte
Avg size per batched transaction: 104 bytes
CPFPs found: 5835

                                Segwit          Legacy
Min fee:                        0.4             0       sat/byte
0.1 percentile fee:             0.5             1       sat/byte
1 percentile fee:               0.7             1       sat/byte
10th percentile fee:            2.5             2.8     sat/byte
50th percentile fee (median):   6.8             10.1    sat/byte
Mean fee:                       15.1            35.8    sat/byte
0-5 sat/byte:                   23.5% (3675)    25.9% (10861)   transactions
5-10 sat/byte:                  63.9% (9981)    20.7% (8664)    transactions
10-15 sat/byte:                 2.3% (359)      24.4% (10240)   transactions
15-20 sat/byte:                 2.3% (354)      3.5% (1466)     transactions
20-50 sat/byte:                 3.2% (496)      10.3% (4298)    transactions
50-100 sat/byte:                1.6% (252)      6.3% (2638)     transactions
100-200 sat/byte:               1.7% (270)      5% (2079)       transactions
200-500 sat/byte:               1.4% (221)      2.7% (1150)     transactions
500+ sat/byte:                  0% (5)          1.3% (530)      transactions
Batch Transactions:             1423            5583            transactions
Avg transactions per batch:     4.3             13              batched-transactions/batch
Estimated % batched txns:       30.2%           66.7%
Avg fee per batched tx:         23.8            36.5            sat/byte
Avg size per batched tx:        214.3           94.7            bytes/tx
```

Note that "batched-transactions/batch" is calculated via the number of outputs in a transaction with 2 or more outputs minus 1 (to remove the expected change output).

Install
=======

Clone the repository and run `yarn install`.

Usage
======

Run `node printFeeStats`. This will create a file called `testBlockHash` that stores the hash of the current latest block. Subsequent runs will use this hash as the starting place. If you'd like to reset and start calcualating stats from the actual latest block, delete that file and rerun `printFeeStats`.

To change how far back you're looking, change the `hoursToLookBack` variable inside `printFeeStats.js`.

Version History
===============

* `1.2.1` - Adding info about batched transaction sizes
* `1.2.0` - Adding info about fee rates for batched transactions
* `1.1.0`
    * Adding batch transaction stats
    * Adding versioning for stored fee info files
* `1.0.0` - First version

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
