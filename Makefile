.PHONY: build up down logs-server logs-client clean rebuild start

build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

logs-server:
	docker compose logs server -f

logs-client:
	docker compose logs client -f

clean:
	docker compose down -v
	docker system prune -f

start:
	$(MAKE) build
	$(MAKE) up

rebuild:
	$(MAKE) clean
	$(MAKE) start