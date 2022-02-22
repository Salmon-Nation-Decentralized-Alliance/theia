
# Quick-Start

1. `extract_pool.sh` : run on a node with `cardano-cli` and an up-to-date blockchain.
2. `python3 process_pool.py --src-url file:///$(pwd)/pool.json`
3. `python3 ping_relay.py --src-url file:///$(pwd)/relay.json` : run on a node with `cncli`

# Discussion

Cardano-node with in-sync blockchain is required to fetch current pool data. 
Read the the following script to understand what it does: 

    ./extract_pool.sh
    # creates:
    #   - 'pool.json' - stake pool info from the blockchain

The pool data needs cleaning and enrichment - fetch metadata, DNS lookup, etc.

    python3 process_pool.py --src-url file:///$(pwd)/pool.json
    # creates: 
    #   - 'relay.json' - cleaned up info from pool.json, augmented with metadata
    #   - 'error.json' - errors encountered while processing SPO data. EG: DNS resolution failed, malformed metadata URL.

Finally we can ping the relays

    python3 ping_relay.py --src-url file:///$(pwd)/relay.json

[urllib](https://docs.python.org/3/library/urllib.html) is used to open the
input files; any URL supported by urllib should work, including: 

  - file://
  - http://
  - https://
  - s3:// (I've been told, haven't tested)



