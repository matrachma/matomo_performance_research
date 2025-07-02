# Matomo Performance Research

This repository contains a Docker Compose setup for running Matomo with a performance-optimized architecture using 5 containers.

## Architecture

The setup consists of the following containers:

1. **MySQL Database (db)**: Stores all Matomo data
2. **Redis (redis)**: Used for caching and queued tracking
3. **Matomo Web (matomo-web)**: Runs the Matomo dashboard UI
4. **Matomo Tracker (matomo-tracker)**: Dedicated to handling tracking requests only
5. **Matomo Worker (matomo-worker)**: Handles background tasks including queued tracking processing and scheduled tasks

## Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB of RAM available for the containers

## Getting Started

1. Clone this repository:
   ```
   git clone https://github.com/matrachma/matomo_performance_research.git
   cd matomo_performance_research
   mkdir -p data/matomo data/mysql data/redis
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

3. Access the Matomo dashboard at:
   ```
   http://localhost:8080
   ```

4. Follow the Matomo setup wizard to complete the installation.

## Configuration

### Database Configuration

During the Matomo setup wizard, use these database settings:
- Database Server: `db`
- Login: `matomo`
- Password: `matomo_password`
- Database Name: `matomo`
- Table Prefix: `matomo_`

### Redis Configuration

To enable Redis for caching, add the following to your `config/config.ini.php` file after initial setup or just copy `config/config.ini.php.sample`:

```ini
[RedisCache]
host = "redis"
port = 6379
timeout = 0.0
database = 0
```

## Container Roles

### matomo-web (Port 8080)
- Serves the Matomo UI dashboard
- Handles admin and reporting functionality
- Shared volume with other Matomo containers

### matomo-tracker (Port 8081)
- Dedicated to handling tracking requests only
- Configured to only accept requests to matomo.php and piwik.php
- Uses Apache's mod_rewrite module for URL filtering
- Optimized for high-volume tracking

### matomo-worker
- Processes queued tracking data using supervisor with 16 queues for optimal performance
- Runs scheduled tasks and archiving via cron
- No exposed ports as it doesn't need direct access

## Volume Configuration

This setup uses local directories for persistent storage:
- `./mysql_data`: Stores MySQL database files
- `./redis_data`: Stores Redis data
- `./matomo_data`: Stores Matomo application files

These directories are automatically created when you first run the setup and will persist your data between container restarts.

## Performance Tuning

This setup separates concerns to optimize performance:
- Tracking requests are isolated from the main application
- Background processing doesn't impact the user interface
- Redis provides fast caching and reliable queue processing
- Queued tracking uses 16 parallel queues for faster processing

## Testing

### K6 Load Testing

This repository includes K6 load testing scripts in the `./tests/k6` folder. K6 is already set up in the docker-compose.yml file.

To run a K6 load test:

1. Make sure your Matomo environment is running:
   ```
   docker-compose up -d
   ```

2. Run a K6 test script using the k6 container:
   ```
   docker-compose run k6 run /scripts/original.js
   ```

You can also run other test scripts:
- `original.js`: Basic load test with a ramp-up, steady state, and ramp-down pattern
- `real-world.js`: Simulates real-world traffic patterns
- `realistic.js`: Creates more realistic visitor behavior
- `suggestion.js`: An optimized test script with suggested parameters

### Worker Testing

To test the Matomo worker that processes the Redis queue:

1. Make sure your Matomo environment is running:
   ```
   docker-compose up -d
   ```

2. Generate visitor data to feed the Redis queue:
   ```
   cat ./tests/generate-visits.sh | docker-compose exec -T matomo-worker bash -s 5
   ```
   This will generate 5 batches of visits. You can adjust the number as needed.

3. Start the supervisor to process the queue:
   ```
   docker-compose exec matomo-worker supervisorctl start all
   ```

4. Monitor the queue processing:
   ```
   docker-compose exec matomo-worker supervisorctl status
   ```

5. When finished, stop the workers:
   ```
   docker-compose exec matomo-worker supervisorctl stop all
   ```

## Maintenance

- View logs: `docker-compose logs -f [service-name]`
- Restart services: `docker-compose restart [service-name]`
- Stop all services: `docker-compose down`
- Stop and remove volumes: `docker-compose down -v` (caution: this deletes all data)
- If you encounter permission issues: `docker-compose restart matomo-web` (this will re-run the permission fix)
