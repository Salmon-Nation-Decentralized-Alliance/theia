#!/usr/bin/python3

import argparse
from concurrent.futures import ProcessPoolExecutor
import copy
import json
import os
import re
import subprocess
import threading
import time
from urllib.request import urlopen


def cncli_ping(address, port, magic, timeout):
    try:
        #print(f"PING: {address}:{port}  magic {magic} ")
        result = subprocess.run(["cncli", "ping", "--host", f"{address}", "--port", f"{port}", "--network-magic", f"{magic}"], stdout=subprocess.PIPE, timeout=timeout)
        if result.returncode == 0:
            text = result.stdout.decode("utf-8")
            return json.loads(text)
        return {
            "status": "error", 
            "address": address, 
            "port": port, 
            "errorMessage": stderr
        }
    except Exception as e:
        return {
            "status": "error", 
            "address": address, 
            "port": port, 
            "errorMessage": f"{e}"
        }

def ping_relay(relay, timeout):
    address = relay["address"]
    port = relay["port"]
    magic = relay["network_magic"]
    ping_result = cncli_ping(address, port, magic, timeout)
    ping_result["timestamp"] = int(time.time())
    enriched = copy.deepcopy(relay)
    enriched["ping_result"] = ping_result 
    return enriched

def relay_sort_key(relay):
    addr = relay["address"]
    port = relay["port"]
    normalized_key = relay["address"]
    if '.' in addr: # ipv4
        part = addr.split(".")
        p0 = int(part[0])
        p1 = int(part[1])
        p2 = int(part[2])
        p3 = int(part[3])
        normalized_key = f"{p0:03d}{p1:03d}{p2:03d}{p3:03d}{port:05d}"
    elif ':' in addr: # ipv6
        # avoid mixing ipv4 and ipv6 addresses
        normalized_key = f"z{addr}z{port}"
    return normalized_key

def sort_relays(unsorted_relays):
    return sorted(unsorted_relays, key=relay_sort_key)

def discard_all_but_one_relays_which_share_address(relays_src):
    relays_sorted = sort_relays(relays_src)
    #for relay in relays_sorted: 
    #    print(relay["address"] + " " + str(relay["port"]))

    relays_dst = []
    addr_hash = {}
    for relay in relays_sorted:
        addr = relay["address"]
        if addr in addr_hash:
            pass
        else:
            relays_dst.append(relay)
            addr_hash[addr] = 1
    return relays_dst


def obfuscate_address(addr):
    if "." in addr:
        part = addr.split(".")
        return f"{part[0]}.{part[1]}.x.x"
    if ":" in addr:
        sub = addr[:9]
        return f"{sub}..."
    return "xx"

def obfuscate_address_in_results(results_orig):
    results = []
    for result_orig in results_orig:
        result = copy.deepcopy(result_orig)
        result["address"] = obfuscate_address(result["address"])
        if "host" in result["ping_result"]:
            result["ping_result"]["host"] = obfuscate_address(result["ping_result"]["host"])
        results.append(result)
    return results

def get_cncli_version():
    result = subprocess.run(["cncli", "--version"], stdout=subprocess.PIPE, timeout=10)
    if result.returncode == 0:
        return result.stdout.decode("utf-8").strip()
    raise Exception("Error running cncli. " + result.stdout)

if __name__ == "__main__":
    VERBOSE_ERROR=0
    VERBOSE_INFO=1
    VERBOSE_DEBUG=2
    default_verbose = VERBOSE_ERROR
    cncli_version=get_cncli_version()
    ping_relay_version = "1.0" # this script's version
    parser = argparse.ArgumentParser(description="Ping Pool - part of the Cardano Pool Reachability Dashboard (CardBoard) project") 
    parser.add_argument("--version", action="version", version=ping_relay_version)
    parser.add_argument("--threads", type=int, default=100, help="max number of concurrent ping processes")
    parser.add_argument("--timeout", type=int, default=10, help="timeout (in seconds) to wait for cncli ping to complete, per relay")
    parser.add_argument("--src-url", required=True, help="URL of input file containing list of all relays, in JSON. EG: file:///path/to/relay.json")
    # TODO: support writing to S3
    parser.add_argument("--dst-file", default="ping_results.json", help="output file: results of cncli ping")
    parser.add_argument("--ping-location", default="unknown", help="location of ping client; added as metadata to output file")
    parser.add_argument("--dry-run", action="store_true", default=False, help="run, but don't ping anything. Output file will be empty.")
    parser.add_argument("--unique-ip", action="store_true", default=False, help="ping each unique address only once, even if multiple relays share the address")
    parser.add_argument("--obfuscate-ip", action="store_true", default=False, help="obfuscate IP addresses in output file")
    parser.add_argument("--verbose", action="count", default=default_verbose, help="increase verbosity")
    param = parser.parse_args()
    results = []
    time_start = time.time()
    with urlopen(param.src_url) as src_json:
        relays = json.load(src_json)
        # At the time of this writing, 30% of relays share an IP address with another relay.
        # For the purpose of this project, we're mainly interested if the 
        # IP address is reachable, less interested in pinging multiple relays
        # behind a single IP address. 
        # Therefore, the following function ensures each IP address appears 
        # only once in the list by discarding all-but-one relays which share an IP address.
        if param.unique_ip:
            relays = discard_all_but_one_relays_which_share_address(relays)
        if param.verbose == VERBOSE_DEBUG:
            for relay in relays: 
                print(relay["address"] + " " + str(relay["port"]))
        futures = []
        with ProcessPoolExecutor(param.threads) as executor:
            if not param.dry_run:
                for relay in relays:
                    futures.append(executor.submit(ping_relay, relay, param.timeout))
            for future in futures:
                result = future.result()
                if param.verbose == VERBOSE_DEBUG:
                    print(result)
                results.append(result)
        results = sort_relays(results)
        if param.obfuscate_ip:
            results = obfuscate_address_in_results(results)
        output_data = {
            "file_type": "cardano_stake_pool_ping_results",
            "version": "1.0",
            "timestamp": int(time.time()),
            "ping_location": param.ping_location,
            "unique_ip": param.unique_ip, 
            "obfuscate_ip": param.obfuscate_ip,
            "cncli_version": cncli_version,
            "ping_relay_version": ping_relay_version,
            "ping_results": results
        }
        with open(param.dst_file, "w") as outfile:
            json.dump(output_data, outfile)
            if param.verbose >= VERBOSE_INFO:
                print(f"{len(results)} ping results written to '{param.dst_file}'")
    time_end = time.time()
    if param.verbose >= VERBOSE_INFO:
        print(f"{(time_end-time_start):.2f}s: total time")
 
