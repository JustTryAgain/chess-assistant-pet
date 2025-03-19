build:
	 docker compose build

up:
	 docker compose up -d

down:
	 docker compose down

logs-server:
	 docker compose logs server -f

logs-client:
	 docker compose logs client -f

rebuild:
	 docker compose down
	 docker compose build --no-cache
	 docker compose up -d

clean:
	 docker compose down -v
	 docker system prune -f