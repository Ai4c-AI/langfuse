#!/bin/bash

# Script to check Doris container status for Langfuse

echo "Checking Doris container status..."

# Check if container exists and is running
if docker ps | grep -q langfuse-doris; then
  echo "Doris container is running"
  
  # Check if Doris is accepting connections
  if docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "SHOW DATABASES" &>/dev/null; then
    echo "Doris is accepting connections"
    
    # Show Doris version
    echo "Doris version:"
    docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "SELECT VERSION()"
    
    # Show Doris databases
    echo "Doris databases:"
    docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "SHOW DATABASES"
    
    exit 0
  else
    echo "Doris container is running but not accepting connections"
    exit 1
  fi
else
  echo "Doris container is not running"
  exit 1
fi