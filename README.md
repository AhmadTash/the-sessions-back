# The Sessions - Backend

Backend API for The Sessions app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally

3. Copy `.env.example` to `.env` and update if needed:
```bash
cp .env.example .env
```

4. Seed the users (Shams and Mango):
```bash
npm run seed
```

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Sessions
- `GET /api/sessions` - Get all sessions (from both users)
- `GET /api/sessions/my-sessions` - Get current user's sessions only
- `POST /api/sessions` - Create a new session
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id` - Delete a session

## Users

After running the seed script, these users will be available:
1. Username: **Shams** / Password: **sarismylife**
2. Username: **Mango** / Password: **shamsismysoul@!**

