
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks. Here's an example of the output

```
293/432 blocks left to download      429 - "Maximum concurrent requests for this endpoint reached. Please try again shortly."
Block heights 503603-503741: 16 hours (2018-01-10 19:50:15 - 2018-01-11 11:29:45)
10% segwit transactions (19695/205678)
CPFPs found: 25173

                                Segwit          Legacy
Min fee:                        37              0       sat/byte
0.1 percentile fee:             68.8            70.1    sat/byte
1 percentile fee:               84.1            130.6   sat/byte
10th percentile fee:            167.4           181.4   sat/byte
50th percentile fee (median):   290.9           508.6   sat/byte
Mean fee:                       290.3           440.2   sat/byte
0-5 sat/byte:                   0% (0)          0% (23) transactions
5-10 sat/byte:                  0% (0)          0% (8)  transactions
10-15 sat/byte:                 0% (0)          0% (9)  transactions
15-20 sat/byte:                 0% (0)          0% (6)  transactions
20-50 sat/byte:                 0% (1)          0.1% (96)       transactions
50-100 sat/byte:                2.9% (564)      0.2% (353)      transactions
100-200 sat/byte:               12.9% (2546)    10.9% (20351)   transactions
200-500 sat/byte:               82.2% (16197)   36% (67045)     transactions
500+ sat/byte:                  2% (386)        52.7% (98091)   transactions
```

Install
=======

Clone the repository and run `yarn install`.

Usage
======

Run `node printFeeStats`. This will create a file called `testBlockHash` that stores the hash of the current latest block. Subsequent runs will use this hash as the starting place. If you'd like to reset and start calcualating stats from the actual latest block, delete that file and rerun `printFeeStats`.

To change how far back you're looking, change the `hoursToLookBack` variable inside `printFeeStats.js`.

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
