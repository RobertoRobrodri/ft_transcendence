#!/bin/bash

CONTRACT_FILE="./contracts/Transcendencechads.sol"
LAST_COMPILE_FILE="./last_migration.txt"

if [ ! -e "$LAST_COMPILE_FILE" ]; then
    touch "$LAST_COMPILE_FILE"
fi

CURRENT_HASH=$(md5sum "$CONTRACT_FILE" | awk '{print $1}')
LAST_HASH=$(cat "$LAST_COMPILE_FILE")

if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
    truffle migrate --network development
    cd ..
    cp /contract/build/contracts/Transcendencechads.json /core/contract/build/contracts/
    echo "$CURRENT_HASH" > "contract/$LAST_COMPILE_FILE"
fi