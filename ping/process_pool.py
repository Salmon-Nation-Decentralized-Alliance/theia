#!/usr/bin/python3
"""
Process Pools
This takes a list of pools.json, cleans up bad data, and resolves
all DNS names into raw IP addresses so the ping application 
can directly talk to all relays without any slowdown. 
"""

import argparse
from concurrent.futures import ProcessPoolExecutor
import copy
import json
import os
import re
import subprocess
import socket
import ssl
import threading
import time
from urllib.request import urlopen

def make_relay(pool, port, address):
    relay = {
        "publicKey": pool["publicKey"],
        "port": port,
        "address": address,
        "name": pool["name"],
        "description": pool["description"],
        "homepage": pool["homepage"], 
        "ticker": pool["ticker"]
    }
    return relay

def get_ip_from_dns(hostname):
    try:
        records = socket.getaddrinfo(hostname,0)
    except socket.gaierror as e: # Name or service not known
        records = []
    addresses = {} # we use dict to de-duplicate addresses
    for record in records:
        if record[0] is socket.AddressFamily.AF_INET:
            addresses[record[4][0]] = 1
        elif record[0] is socket.AddressFamily.AF_INET6:
            addresses[record[4][0]] = 1
        else:
            pass
    return addresses.keys()

re_ipv4=re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$")
re_ipv6=re.compile(r"^[0-9a-f:]+$") # could be better
re_dns=re.compile(r"^[a-z0-9-.]+$")
def validate_and_process_address(pool, port, addr_in):
    if type(addr_in) is not str:
        return []
    addr = addr_in.lower()
    if len(addr_in) > 255:
        return []
    if len(addr_in) < 1:
        return []
    if port is None or port == "None":
        return []
    hosts = []
    if re_ipv4.match(addr) is not None:
        hosts.append(make_relay(pool, port, addr))
    elif re_ipv6.match(addr) is not None:
        hosts.append(make_relay(pool, port, addr))
    elif re_dns.match(addr) is not None:
        addresses = get_ip_from_dns(addr)
        for address in addresses:
             hosts.append(make_relay(pool, port, address))
    return hosts

def process_relay(pool, relay):
    relays=[]
    errors=[]
    # Because there's so much bad data, we shove everything into a single address validation pipeline
    # TODO: we should split this up and perform proper validation; it would be useful to SPOs to know their data is bad. 
    for relay_type in ['single host name', 'single host address', 'multi host name']:
        relay_field = relay.get(relay_type, None)
        if type(relay_field) is dict: 
            port = relay_field.get('port', 3001)
            for address_type in ['IPv4', 'IPv6', 'dnsName']:
                address_field = relay_field.get(address_type, None)
                if type(address_field) is str:
                    relays.extend(validate_and_process_address(pool, port, address_field))
    return relays, errors

def process_pool_into_relays(pool, network_magic):
    relays = []
    errors = []
    if "relays" in pool and type(pool["relays"]) is list and len(pool["relays"]) > 0:
        for relay in pool["relays"]:
            new_relays, new_errors = process_relay(pool, relay)
            relays.extend(new_relays)
            errors.extend(new_errors)
    else:
        errors.append(["no relays found in pool registration record", pool])
    for relay in relays:
        relay["network_magic"] = network_magic
    return relays, errors

def enrich_pool_with_metadata(pool_in):
    pool = copy.deepcopy(pool_in)
    errors = []
    pool["name"] = pool["publicKey"]
    pool["description"] = ""
    pool["ticker"] = ""
    pool["homepage"] = ""
    if type(pool.get("metadata", None)) is dict and type(pool["metadata"].get("url", None)) is str:
        url = pool["metadata"]["url"]
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with urlopen(url, timeout=10, context=ctx) as metadata_json:
                meta = json.load(metadata_json)
                pool["name"] = meta.get("name", pool["publicKey"])
                pool["description"] = meta.get("description", "")
                pool["ticker"] = meta.get("ticker", "")
                pool["homepage"] = meta.get("homepage", "")
            # TODO: enrich with extended metadata
        except Exception as err:
            err_str = str(err)
            errors.append([f"Error fetching pool metadata: {err_str}", pool])
    else:
        errors.append(["Missing metadata URL", pool])
    return pool, errors

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="process pool.json into a list of relays for ping_relay.py - part of the Cardano Pool Reachability Dashboard (CardBoard) project")
    parser.add_argument("--version", action="version", version="1.0")
    parser.add_argument("--src-url", required=True, help="URL of input file containing list of all pools, in JSON. EG: file:///path/to/pool.json")
    parser.add_argument("--threads", type=int, default=100, help="max number of concurrent processes")
    parser.add_argument("--network-magic", type=int, default=764824073, help="Network magic number, defaults to Cardano mainnet")
    parser.add_argument("--relay", default="relay.json", help="output file: relays (for use by ping_relay.py)")
    parser.add_argument("--error", default="error.json", help="output file: errors encountered during processing")
    param = parser.parse_args()

    pools_raw = []
    errors = []
    relays = []
    time_start = time.time()
    time_pools = time_start
    time_enriched = time_start
    time_dns_resolution =time_start
    with urlopen(param.src_url, timeout=10) as src_json:
        pools_raw = json.load(src_json).values()
        time_pools = time.time()
        pools_enriched = []
        futures = []
        with ProcessPoolExecutor(param.threads) as executor:
            for pool_raw in pools_raw:
                futures.append(executor.submit(enrich_pool_with_metadata, pool_raw))
            for future in futures:
                pool_enriched, new_errors = future.result()
                print(f"Enriched: {pool_enriched}")
                print(f"Errors: {new_errors}")
                pools_enriched.append(pool_enriched)
                errors.extend(new_errors)
        time_enriched = time.time()
        futures = []
        with ProcessPoolExecutor(param.threads) as executor:
            for pool in pools_enriched:
                futures.append(executor.submit(process_pool_into_relays, pool, param.network_magic))
            for future in futures:
                new_relays, new_errors = future.result()
                print(f"Relays: {new_relays}")
                print(f"Errors: {new_errors}")
                relays.extend(new_relays)
                errors.extend(new_errors)
        time_dns_resolution = time.time()
        print(f"{len(pools_raw)} pools processed")
        with open(param.relay, "w") as outfile:
            json.dump(relays,outfile)
            print(f"{len(relays)} relays written to '{param.relay}'")
    with open(param.error, "w") as outfile:
        json.dump(errors,outfile)
        print(f"{len(errors)} errors written to '{param.error}'")
    time_end=time.time()

    print(f"{(time_pools-time_start):.2f}s: read pools from {param.src_url}")
    print(f"{(time_enriched-time_pools):.2f}s: enrich pools with metadata")
    print(f"{(time_dns_resolution-time_enriched):.2f}s: resolve relay DNS to IP addresses")
    print(f"{(time_end-time_dns_resolution):.2f}s: write output files")
    print(f"{(time_end-time_start):.2f}s: total time")
 
