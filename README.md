
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks. This uses blockchain.info's api to get block information.

Here's an example of the output

```
293/432 blocks left to download      429 - "Maximum concurrent requests for this endpoint reached. Please try again shortly."
Block heights 513041-513100: 8 hours (2018-03-11 09:52:32 - 2018-03-11 17:55:03)
30% segwit transactions (16696/55023)
49% transactions batched (estimated) (48121/98870)
Avg fee per batched transaction: 34.3 sat/byte
CPFPs found: 5710

                                Segwit          Legacy
Min fee:                        0.4             0       sat/byte
0.1 percentile fee:             0.5             1       sat/byte
1 percentile fee:               0.7             1       sat/byte
10th percentile fee:            2.7             2.2     sat/byte
50th percentile fee (median):   7.1             10.7    sat/byte
Mean fee:                       11              34.6    sat/byte
0-5 sat/byte:                   19.6% (3268)    22.7% (8717)    transactions
5-10 sat/byte:                  69.7% (11638)   20.1% (7697)    transactions
10-15 sat/byte:                 3% (505)        25.4% (9723)    transactions
15-20 sat/byte:                 1.9% (320)      5.3% (2022)     transactions
20-50 sat/byte:                 3.1% (522)      12.4% (4743)    transactions
50-100 sat/byte:                1.3% (209)      6.2% (2373)     transactions
100-200 sat/byte:               0.9% (145)      4.4% (1697)     transactions
200-500 sat/byte:               0.5% (87)       2.3% (863)      transactions
500+ sat/byte:                  0% (1)          1.3% (491)      transactions
Batch Transactions:             1133            3139            transactions
Avg transactions per batch:     4.1             13.8            batched-transactions/batch
Estimated % batched txns:       23%             55.3%
Avg fee per batched tx:         18.3            38.2            sat/byte
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

* `1.2.0` - Adding info about fee rates for batched transactions
* `1.1.0`
    * Adding batch transaction stats
    * Adding versioning for stored fee info files
* `1.0.0` - First version

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
