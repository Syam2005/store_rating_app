# Store Rating App (Express + PostgreSQL + React)

## Run
1. Create DB: `createdb store_rating`
2. Backend:
   ```
   cd backend && cp .env.example .env   # edit DATABASE_URL / JWT_SECRET
   npm install && npm run seed && npm run dev
   ```
3. Frontend: `cd frontend && npm install && npm run dev` -> http://localhost:5173

Default admin: admin@example.com / Admin@123
Flow: login as admin -> add a Store Owner user -> add a store and assign that owner -> sign up normal users and rate.
