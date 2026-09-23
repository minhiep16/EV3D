# EVShare 3D

**EVShare 3D – Intelligent Web 3D Platform for Electric Vehicle Co-ownership Management and Operations**

## Architecture

- **Frontend**: React, Vite, TypeScript, Three.js, React Three Fiber, @react-three/drei, Zustand, TanStack Query
- **Backend**: Java 21+, Spring Boot 3.3.x, Spring Web, Spring Data JPA, Hibernate, Flyway, Actuator
- **Database**: MySQL 8+ (`evshare3d`)

## Getting Started (Phase 00)

### 1. Database (MySQL 8)
- Local service: Running on `localhost:3306` with database `evshare3d`.
- Or via Docker:
  ```bash
  docker compose up -d
  ```

### 2. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`.
Health endpoint: `http://localhost:8080/api/health`

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
