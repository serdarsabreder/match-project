# Match

Platform for booking football fields. Users are players (book fields) or field owners (add fields with parameters and photos).

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic, SQLite.
- **Frontend:** TypeScript, React (Vite), plain CSS.
- **HTTP Client:** fetch (frontend), httpx (backend tests).
- **Build:** npm (frontend), uvicorn (backend).

## Getting Started

### Backend (port 8000)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.ts`).

## API Endpoints

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| POST   | `/api/register`       | Register user, returns `user_id`, `role` |
| GET    | `/api/fields?city=`   | List fields filtered by city             |
| POST   | `/api/book`           | Book a field (field_id, user_id, date)   |
| POST   | `/api/field`          | Add a field by owner (params + photos)   |

## Tests

```bash
# backend
cd backend && source venv/bin/activate && pytest ../tests/backend
```

## TODO

- Add authentication (JWT/OAuth) for real accounts.
- Replace SQLite with a production database.
- Add availability calendar per field.
- Support file storage in the cloud.