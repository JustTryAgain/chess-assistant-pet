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

rebuild:
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) up

start:
	$(MAKE) build
	$(MAKE) up