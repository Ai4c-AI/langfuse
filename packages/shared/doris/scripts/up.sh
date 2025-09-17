#!/bin/bash

# Script to start Doris container for Langfuse

echo "Starting Doris container..."

# Check if docker-compose.doris.yml exists
if [ ! -f "../../../docker-compose.doris.yml" ]; then
  echo "Error: docker-compose.doris.yml not found!"
  exit 1
fi

# Create network if it doesn't exist
docker network inspect langfuse-network >/dev/null 2>&1 || docker network create langfuse-network

# Start Doris container
docker-compose -f ../../../docker-compose.doris.yml up -d

# Wait for Doris to be ready
echo "Waiting for Doris to be ready..."
for i in {1..30}; do
  if docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "SHOW DATABASES" &>/dev/null; then
    echo "Doris is ready!"
    
    # Create langfuse database if it doesn't exist
    echo "Creating langfuse database if it doesn't exist..."
    docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "CREATE DATABASE IF NOT EXISTS langfuse"
    
    # Create langfuse user if it doesn't exist
    echo "Creating langfuse user if it doesn't exist..."
    docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "CREATE USER IF NOT EXISTS 'langfuse'@'%' IDENTIFIED BY 'langfuse'"
    
    # Grant privileges to langfuse user
    echo "Granting privileges to langfuse user..."
    docker exec langfuse-doris mysql -h127.0.0.1 -P9030 -uroot -proot -e "GRANT ALL PRIVILEGES ON langfuse.* TO 'langfuse'@'%'"
    
    echo "Doris setup completed successfully!"
    exit 0
  fi
  echo "Waiting for Doris to start... ($i/30)"
  sleep 5
done

echo "Error: Timed out waiting for Doris to start"
exit 1