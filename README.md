# Content Broadcasting System

A backend system for educational environments where teachers broadcast subject-based content to students via a public API, with a principal-controlled approval workflow.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| File Upload | multer (local storage) |
| Rate Limiting | express-rate-limit |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a strong JWT_SECRET

# 3. Create the database (PostgreSQL)
createdb content_broadcasting
# OR via psql:
# psql -U postgres -c "CREATE DATABASE content_broadcasting;"

# 4. Start the server (schema is applied automatically on startup)
npm run dev      # development (nodemon)
npm start        # production
```

The server runs on `http://localhost:3000` by default.

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a teacher or principal |
| POST | `/api/auth/login` | Public | Login and receive JWT token |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@school.com",
  "password": "secret123",
  "role": "teacher"
}
```

**Login body:**
```json
{ "email": "john@school.com", "password": "secret123" }
```

---

### Content (Teacher)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/content/upload` | Teacher | Upload content (multipart/form-data) |
| GET | `/api/content/my` | Teacher | View own uploaded content |

**Upload form fields:**
| Field | Required | Description |
|---|---|---|
| `file` | Yes | Image file (JPG/PNG/GIF, max 10MB) |
| `title` | Yes | Content title |
| `subject` | Yes | Subject name (e.g. maths, science) |
| `description` | No | Optional description |
| `start_time` | No | ISO datetime — when content becomes visible |
| `end_time` | No | ISO datetime — when content stops being visible |
| `rotation_duration` | No | Minutes this content shows per rotation cycle (default: 5) |

> Without `start_time` / `end_time`, approved content will NOT be shown in the live feed.

---

### Content (Principal)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/content/all` | Principal | View all content (filter by ?status=&subject=&teacher_id=) |
| GET | `/api/content/pending` | Principal | View only pending content |
| PATCH | `/api/content/:id/approve` | Principal | Approve content |
| PATCH | `/api/content/:id/reject` | Principal | Reject content |

**Reject body:**
```json
{ "rejection_reason": "Inappropriate content" }
```

---

### Public Broadcast

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/content/live/:teacherId` | Public (no auth) | Get currently active content for a teacher |

**Optional query param:** `?subject=maths`

**Response when content is active:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 5 Quiz",
      "subject": "maths",
      "file_url": "/uploads/1714123456789-123456.png",
      "rotation_duration": 5,
      "start_time": "2026-04-26T09:00:00.000Z",
      "end_time": "2026-04-26T17:00:00.000Z"
    }
  ]
}
```

**Response when no content is available:**
```json
{ "success": true, "message": "No content available", "data": [] }
```

---

## Scheduling Logic

Each subject maintains an independent rotation cycle:

```
Subject: maths
  Content A → 5 min  (rotation_order 0)
  Content B → 5 min  (rotation_order 1)
  Content C → 3 min  (rotation_order 2)
  total cycle = 13 min

elapsed = (now - earliest_start_time) % 13 min
  0-5 min  → show A
  5-10 min → show B
  10-13 min→ show C
  → loops
```

The algorithm is stateless — computed fresh on every request using `(now - earliest_start_time) % total_cycle_duration`.

---

## Content Lifecycle

```
Uploaded by Teacher → status: pending
       ↓
Principal reviews
       ↓
Approved → status: approved  →  visible in /live if within time window
       ↓
Rejected → status: rejected  →  rejection_reason shown to teacher
```

---

## Edge Cases

| Case | Behavior |
|---|---|
| No approved content for teacher | `{ message: "No content available", data: [] }` |
| Approved but no start/end time set | Not shown (not scheduled) |
| Approved but outside time window | Not shown |
| Teacher ID doesn't exist | `{ message: "No content available", data: [] }` |
| Invalid subject filter | Returns empty data (not an error) |

---

## Assumptions & Notes

- `start_time` and `end_time` are required for content to appear live. Content without them is approved but inactive by design.
- Subject names are stored lowercase (`maths`, not `Maths`).
- Uploaded files are served at `GET /uploads/:filename`.
- The rotation anchor is the earliest `start_time` among currently active items in a subject — this makes the rotation deterministic and consistent across restarts.
- Rate limiting: 60 requests/minute per IP on the public broadcast endpoint.
