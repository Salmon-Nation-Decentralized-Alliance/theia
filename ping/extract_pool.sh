#!/usr/bin/bash

# As-of 01 Jan 2022, cardano-node v1.31.0, the following command requires about 32GB system RAM: 
# - 10 GB for cardano-node
# - 22 for cardano-cli
# - some left over for the OS. 
cardano-cli query ledger-state --mainnet > ledger-state.json

# From: https://github.com/input-output-hk/cardano-node/blob/master/doc/stake-pool-operations/query_stakepool.md
#   Each snapshot is taken at the end of a different era. The go snapshot 
#   is the current one and was taken two epochs earlier, set was taken 
#   one epoch ago,  and mark was taken immediately before the start of the 
#   current epoch.
# IE:
#   stateBefore.esSnapshots.pstakeGo.poolParams
#   stateBefore.esSnapshots.pstakeMark.poolParams
#   stateBefore.esSnapshots.pstakeSet.poolParams
cat ledger-state.json | jq '.stateBefore.esSnapshots.pstakeMark.poolParams' > pool.json

