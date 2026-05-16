Deployment (Docker Compose)

This repository includes Dockerfiles and a docker-compose.yml that start a production-like stack:
- MySQL database with `db-setup.sql` applied at first boot
- Node/Express backend
- Nginx-served static frontend with proxy to backend

Quick start (Linux / Windows PowerShell with Docker Desktop):

1. Copy or update environment variables in `backend/.env.template` (or create `backend/.env`) and set a secure `JWT_SECRET`.

2. Build and start the stack:

```powershell
cd <project-root>
docker compose up -d --build
```

3. Verify services:
- Frontend: http://localhost
- Backend health: http://localhost:5000/api/health
- MySQL: 3306 (root password: from compose)

Notes:
- The compose file mounts `backend/db-setup.sql` into MySQL's `/docker-entrypoint-initdb.d/` so the schema runs on the first start. If you want to run migrations repeatedly, use `backend/init-db.js` against the running MySQL instance.
- For production, replace passwords and `JWT_SECRET` with secure secrets and consider using a managed database and a real TLS-terminating proxy.
- To view logs: `docker compose logs -f backend`.

If you want, I can:
- start the Docker stack here and verify registration/login flows locally
- add a `Makefile` or GitHub Actions workflow to build and push images
- provide an Nginx TLS example and systemd unit for a VM

CI / Image Build (GitHub Actions)

I added a workflow at `.github/workflows/build-and-push.yml` that builds and pushes Docker images for the frontend and backend to Docker Hub. To use it:

1. Add the following repository secrets: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (or use another registry and adjust the workflow).
2. Push to `main`; the workflow will build and push `DOCKERHUB_USERNAME/traveloop-backend:latest` and `DOCKERHUB_USERNAME/traveloop-frontend:latest`.

Once images are pushed, you can deploy them to any container host (EC2, DigitalOcean, GCP, etc.).
