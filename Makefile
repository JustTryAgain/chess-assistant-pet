build:
	sudo docker compose build

up:
	sudo docker compose up -d

down:
	sudo docker compose down

logs-server:
	sudo docker compose logs server -f

logs-client:
	sudo docker compose logs client -f

rebuild:
	sudo docker compose down
	sudo docker compose build --no-cache
	sudo docker compose up -d

clean:
	sudo docker compose down -v
	sudo docker system prune -f