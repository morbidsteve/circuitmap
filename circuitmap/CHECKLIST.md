# CircuitMap - Quick Setup Checklist

Copy this repo to new host, then follow these steps:

## Initial Setup

- [ ] `npm install` (or `pnpm install`)
- [ ] `docker-compose up -d`
- [ ] `npm run db:generate`
- [ ] `npm run db:push`
- [ ] `npm run db:seed`
- [ ] `npm run dev`

## Verify

- [ ] Docker services running: `docker-compose ps`
- [ ] Open http://localhost:3000/demo
- [ ] Click a breaker and see connected devices
- [ ] Check Prisma Studio: `npm run db:studio`

## Demo Credentials

- Email: `demo@circuitmap.com`
- Password: `demo123`

## Common Issues

**Docker not running?**
```bash
sudo systemctl start docker
docker-compose up -d
```

**Port conflicts?**
Edit `docker-compose.yml` ports section

**Database errors?**
```bash
docker-compose restart postgres
npm run db:push
```

**Clean slate?**
```bash
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

## That's It!

Everything is configured and ready to go. See SETUP.md for detailed instructions.
