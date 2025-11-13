# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Related Documentation

- [Database Configuration Guide](./DATABASE_CONFIG.md) - Complete guide to database setup, schema, and integration patterns
- [Prisma Schema](/packages/database/prisma/schema.prisma) - Full database schema definition

---

## Endpoints

### POST /api/tutor

Call the AI tutor with student question and context.

**Request:**
```json
{
  "userText": "Help me add a button",
  "context": {
    "task": { ... },
    "test_result": { ... },
    "editor": { ... },
    "student": { ... }
  }
}
```

**Response:**
```json
{
  "ui_messages": [
    {"type": "assistant", "text": "Let's add a button..."}
  ],
  "hint": {"level": 2, "concept_tag": "html-buttons"},
  "actions": [
    {"type": "write_files", "files": {...}},
    {"type": "run_tests"}
  ]
}
```

---

### POST /api/eval

Run tests against student code.

**Request:**
```json
{
  "task": {
    "tests": [
      {"id": "has-button", "code": "document.querySelector('button') !== null"}
    ]
  },
  "files": {
    "index.html": "<!DOCTYPE html>..."
  }
}
```

**Response:**
```json
{
  "passed": false,
  "passedIds": [],
  "failedIds": ["has-button"],
  "messages": {
    "has-button": "No button element found"
  }
}
```

---

### POST /api/mastery

Update student mastery scores.

**Request:**
```json
{
  "userId": "user_123",
  "tags": ["html-basics", "css-styling"],
  "result": "pass"
}
```

**Response:**
```json
{
  "ok": true,
  "updates": [
    {
      "concept": "html-basics",
      "oldMastery": 800,
      "newMastery": 816,
      "change": 16
    }
  ]
}
```

---

### GET /api/mastery?userId={id}

Get student progress.

**Response:**
```json
{
  "userId": "user_123",
  "progress": [
    {
      "concept": "html-basics",
      "mastery": 850,
      "attempts": 5,
      "successes": 4,
      "successRate": "80.0"
    }
  ]
}
```

---

### GET /api/tasks

List all tasks (loads from local files or database based on `TASKS_SOURCE` env var).

**Query Params:**
- `difficulty` or `level` (optional): Filter by difficulty level 1-5 (both parameters work the same)
- `limit` (optional): Number of items to return (default: 15)
- `offset` (optional): Number of items to skip for pagination (default: 0)

**Examples:**
```
GET /api/tasks?difficulty=1
GET /api/tasks?level=2&limit=10
GET /api/tasks?difficulty=3&limit=5&offset=10
```

**Response:**
```json
{
  "items": [
    {
      "id": "l1-1-headings-101",
      "title": "Create Your First Webpage",
      "difficulty": 1,
      "scaffold": {...},
      "tests": [...],
      "hints": [...]
    }
  ],
  "total": 120
}
```

---

### GET /api/tasks/[id]

Get specific task with full details.

**Response:**
```json
{
  "task": {
    "id": "html-basics-1",
    "title": "...",
    "scaffold": {...},
    "tests": [...],
    "hints": [...]
  }
}
```

---

### POST /api/tasks/next

Get next recommended task.

**Request:**
```json
{
  "userId": "user_123",
  "strategy": "just-right"  // or "sequential"
}
```

**Response:**
```json
{
  "task": { ... }
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Description of what went wrong"
}
```

**Common Status Codes:**
- `400` - Bad Request (missing parameters)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limits

Development: No limits
Production: TBD (recommend 100 requests/minute per user)

---

## Authentication

Currently: None required
Future: Add `Authorization: Bearer <token>` header