
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks. This uses blockchain.info's api to get block information.

Here's an example of the output

```
293/432 blocks left to download      429 - "Maximum concurrent requests for this endpoint reached. Please try again shortly."
Block heights 513040-513099: 8 hours (2018-03-11 09:39:39 - 2018-03-11 17:37:23)
30% segwit transactions (16319/53897)
48% transactions batched (estimated) (45022/94755)
CPFPs found: 5575

                                Segwit          Legacy
Min fee:                        0.4             0       sat/byte
0.1 percentile fee:             0.5             1       sat/byte
1 percentile fee:               0.7             1       sat/byte
10th percentile fee:            2.7             2.2     sat/byte
50th percentile fee (median):   7.1             10.7    sat/byte
Mean fee:                       10.9            34.5    sat/byte
0-5 sat/byte:                   19.2% (3141)    23.1% (8669)    transactions
5-10 sat/byte:                  70.1% (11445)   20% (7515)      transactions
10-15 sat/byte:                 3% (497)        25.2% (9476)    transactions
15-20 sat/byte:                 1.8% (299)      5.3% (2006)     transactions
20-50 sat/byte:                 3.1% (513)      12.3% (4605)    transactions
50-100 sat/byte:                1.3% (209)      6.2% (2343)     transactions
100-200 sat/byte:               0.8% (134)      4.4% (1643)     transactions
200-500 sat/byte:               0.5% (79)       2.2% (839)      transactions
500+ sat/byte:                  0% (1)          1.3% (481)      transactions
Batch Transactions :            1100            3062            transactions
Avg transactions per batch:     4.1             13.2            batched-transactions/batch
Estimated % batched txns:       22.9%           54%
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

* `1.1.0`
    * Adding batch transaction stats
    * Adding versioning for stored fee info files
* `1.0.0` - First version

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
