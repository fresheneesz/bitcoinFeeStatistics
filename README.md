
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks. This uses blockchain.info's api to get block information.

Here's an example of the output

```
293/432 blocks left to download      429 - "Maximum concurrent requests for this endpoint reached. Please try again shortly."
Block heights 513178-513237: 9 hours (2018-03-12 04:59:46 - 2018-03-12 13:39:28)
28% segwit transactions (20643/74466)
46% transactions batched (estimated) (56434/123630)
Avg fee per batch payment: 33 sat/byte
Avg size per batch payment: 150.9 bytes
CPFPs found: 8820

                                Segwit          Legacy
Min fee:                        0.5             0       sat/byte
0.1 percentile fee:             0.6             1       sat/byte
1 percentile fee:               1.2             1.3     sat/byte
10th percentile fee:            2.2             3.3     sat/byte
50th percentile fee (median):   6.5             10.6    sat/byte
Mean fee:                       12              39.7    sat/byte
0-5 sat/byte:                   16.3% (3361)    18.3% (9835)    transactions
5-10 sat/byte:                  67.6% (13946)   21.6% (11634)   transactions
10-15 sat/byte:                 3.8% (784)      22% (11822)     transactions
15-20 sat/byte:                 3.8% (778)      3.5% (1870)     transactions
20-50 sat/byte:                 4.8% (995)      17.1% (9190)    transactions
50-100 sat/byte:                2.3% (465)      9.2% (4954)     transactions
100-200 sat/byte:               1% (208)        4.5% (2433)     transactions
200-500 sat/byte:               0.5% (103)      2.4% (1306)     transactions
500+ sat/byte:                  0% (2)          1.4% (778)      transactions
Batch Transactions:             1982            5286            transactions
Avg payments per batch:         4.6             8.9             batched-payments/batch
Estimated % batched payments:   32.8%           49.4%
Avg fee per batched payment:    17.6            37              sat/byte
Median fee per batched payment: 7.2             11              sat/byte
Avg size per batched payment:   196.5           142.1           bytes/payment
```

These stats take into account child-pays-for-parent transactions. Note that "batched-payments/batch" is calculated via the number of outputs in a transaction with 2 or more outputs minus 1 (to remove the expected change output).



Install
=======

Clone the repository and run `yarn install`.

Usage
======

Run `node printFeeStats`. This will create a file called `testBlockHash` that stores the hash of the current latest block. Subsequent runs will use this hash as the starting place. If you'd like to reset and start calcualating stats from the actual latest block, delete that file and rerun `printFeeStats`.

To change how far back you're looking, change the `hoursToLookBack` variable inside `printFeeStats.js`.

Version History
===============

* `1.2.1` - Adding batch median fee info
* `1.2.1` - Adding info about batched transaction sizes
* `1.2.0` - Adding info about fee rates for batched transactions
* `1.1.0`
    * Adding batch transaction stats
    * Adding versioning for stored fee info files
* `1.0.0` - First version

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
