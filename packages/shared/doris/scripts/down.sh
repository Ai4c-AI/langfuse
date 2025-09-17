#!/bin/bash

# Script to stop Doris container for Langfuse

echo "Stopping Doris container..."

# Check if docker-compose.doris.yml exists
if [ ! -f "../../../docker-compose.doris.yml" ]; then
  echo "Error: docker-compose.doris.yml not found!"
  exit 1
fi

# Stop Doris container
docker-compose -f ../../../docker-compose.doris.yml down

echo "Doris container stopped successfully!"