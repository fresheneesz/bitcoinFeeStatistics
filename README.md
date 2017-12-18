
`bitcoinFeeStatistics`
=====

Calculates statistics about the last N blocks.


Install
=======

Clone the repository and run `yarn install`.

Usage
======

Run `node printFeeStats`. This will create a file called `testBlockHash` that stores the hash of the current latest block. Subsequent runs will use this hash as the starting place. If you'd like to reset and start calcualating stats from the actual latest block, delete that file and rerun `printFeeStats`.

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT