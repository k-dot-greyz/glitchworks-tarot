#!/bin/bash

set -e

echo "Starting MCP Server for GLITCHWORKS_TAROT..."

CONFIG_FILE="./server-config.yaml"
CHUNKER="../context-chunks/chunking.js"
INDEXER="../context-chunks/dynamic-indexing.js"

export NODE_ENV=production

node mcp-server.js \
  --config "$CONFIG_FILE" \
  --chunker "$CHUNKER" \
  --indexer "$INDEXER"

echo "MCP Server started. Check logs at /var/log/glitchworks_tarot_mcp.log"
