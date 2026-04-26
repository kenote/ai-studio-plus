.PHONY: install dev build lint preview start stop delete restart logs clean help

help:
	@echo "AI Studio Plus - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make lint       - Run linters"
	@echo "  make preview   - Preview production build"
	@echo ""
	@echo "PM2:"
	@echo "  make start   - Start with PM2"
	@echo "  make stop    - Stop PM2"
	@echo "  make delete  - Delete PM2"
	@echo "  make restart - Restart PM2"
	@echo "  make logs    - View PM2 logs"
	@echo ""
	@echo "Clean:"
	@echo "  make clean       - Clean build artifacts"

install:
	@npm install

dev:
	@npm run dev

build:
	@@npm run build:spa

lint:
	@npm run lint

preview:
	@npm run preview

start:
	@[ -f ecosystem.config.cjs ] && pm2 start ecosystem.config.cjs && pm2 save

stop:
	@pm2 stop ai-studio-plus

delete:
	@pm2 delete ai-studio-plus

restart:
	@pm2 restart ai-studio-plus

logs:
	@pm2 logs ai-studio-plus

clean:
	@rm -rf dist