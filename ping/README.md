
Cardano-node with in-sync blockchain is required to fetch current pool data. 
Read the the following script to understand what it does: 

    ./extract_pool.sh

The pool data needs cleaning and enrichment - fetch metadata, DNS lookup, etc.

    python3 process_pool.py --src-url file:///$(pwd)/pool.json

Finally we can ping the relays

    python3 ping_relay.py --src-url file:///$(pwd)/relay.json

[urllib](https://docs.python.org/3/library/urllib.html) is used to open the
input files; any URL supported by urllib should work, including: 

  - file://
  - http://
  - https://
  - s3:// (I've been told, haven't tested)



