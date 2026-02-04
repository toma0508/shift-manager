wsl
でWSL2起動した状態で
Docker Desktopを起動
docker run --name shift-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shift_manager -p 5432:5432 -d postgres:16

npm run db:push
