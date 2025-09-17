# Apache Doris Integration for Langfuse

This directory contains the necessary files and scripts to integrate Apache Doris with Langfuse as a replacement for ClickHouse.

## Overview

Apache Doris is a high-performance, real-time analytical database based on MPP architecture. It's designed to support high-concurrency point queries and complex analytical queries, making it an excellent alternative to ClickHouse for Langfuse's analytical needs.

## Version Information

Langfuse uses Apache Doris version 3.1.0. This version includes improved query performance, enhanced SQL compatibility, and better resource management compared to previous versions.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js and pnpm installed

### Configuration

1. Copy the `.env.example` file to your project's `.env` file and adjust the values as needed:

```bash
cp packages/shared/doris/.env.example .env
```

2. Make sure the following environment variables are set in your `.env` file:

```
DORIS_HOST=localhost
DORIS_PORT=9030
DORIS_DB=langfuse
DORIS_USER=langfuse
DORIS_PASSWORD=langfuse
```

### Starting Doris

You can start Doris using one of the following methods:

#### Using Docker Compose

```bash
docker-compose -f docker-compose.doris.yml up -d
```

#### Using npm Scripts

```bash
pnpm run doris:up
```

### Initializing the Database

After starting Doris, you need to initialize the database schema:

```bash
pnpm run doris:seed
```

### Migrating from ClickHouse

If you're migrating from ClickHouse to Doris, you can use the migration script:

```bash
pnpm run doris:migrate
```

## Database Schema

The Doris database schema includes the following tables:

- `traces`: Stores trace information
- `observations`: Stores observation data (generations, spans)
- `scores`: Stores score information
- `blob_storage_file_log`: Stores file storage logs

## Scripts

- `doris:up`: Start the Doris container
- `doris:down`: Stop the Doris container
- `doris:reset`: Reset the Doris database (down, up, seed)
- `doris:seed`: Seed the Doris database with sample data
- `doris:migrate`: Migrate data from ClickHouse to Doris

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Doris, check the following:

1. Ensure the Doris container is running:
   ```bash
   docker ps | grep langfuse-doris
   ```

2. Verify the connection details in your `.env` file

3. Check the Doris logs:
   ```bash
   docker logs langfuse-doris
   ```

### Migration Issues

If you encounter issues during migration:

1. Ensure both ClickHouse and Doris are running
2. Check that the schema in Doris matches the schema in ClickHouse
3. Try running the migration with a smaller batch size

## Additional Resources

- [Apache Doris Documentation](https://doris.apache.org/docs/get-starting/)
- [MySQL Client for Node.js (mysql2)](https://github.com/sidorares/node-mysql2)