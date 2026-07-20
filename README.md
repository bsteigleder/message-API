# Message API

A small but production-minded messaging API built as a technical assignment.

## Overview

This API stores and manages short text messages. It exposes REST endpoints for creating, reading, listing, deleting, and resetting messages, plus basic operational statistics.

The service is intentionally small: it runs with Node.js, stores data in SQLite, and does not require an external database or extra infrastructure.

## Requirements

- Node.js 22+
- npm

Docker is optional.

## Running Locally

```bash
npm install
npm start
```

The API starts on port `3000` by default.

Optional environment variables:

- `PORT`: defaults to `3000`
- `DATABASE_PATH`: defaults to `messages.sqlite`

## Running With Docker

```bash
docker build -t message-api .
docker run --rm -p 3000:3000 message-api
```

Docker is optional. The API can also run directly with Node.js.

## Running Tests

```bash
npm test
```

The test suite uses Jest and Supertest with an in-memory SQLite database.

## Endpoints

### Health Check

`GET /health`

```json
{ "status": "ok" }
```

### Create Message

`POST /messages`

Request body:

```json
{ "message": "Hello world" }
```

Validation rules:

- Message is required.
- Message must be at least 5 characters.
- Message must be at most 200 characters.
- Message must contain at least one alphanumeric character.
- Message must not duplicate an existing stored message.

Success response:

```json
{
  "id": 1,
  "message": "Hello world",
  "createdAt": "2026-07-20T12:00:00.000Z"
}
```

Possible errors: `400 Bad Request`, `409 Conflict`, `500 Internal Server Error`.

### List Messages

`GET /messages`

Optional query parameters:

- `page`: page number, defaults to `1`
- `limit`: page size, defaults to `20`, maximum `100`
- `query`: filters messages using a partial text match
- `createdSince`: filters messages created from a date or datetime

Examples:

```http
GET /messages?page=1&limit=20
GET /messages?page=1&limit=20&query=hello
GET /messages?page=1&limit=20&createdSince=2026-07-20
GET /messages?page=1&limit=20&createdSince=2026-07-20T10:30:00.000Z
```

Response:

```json
{
  "data": [
    {
      "id": 1,
      "message": "Hello world",
      "createdAt": "2026-07-20T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### Get Message By ID

`GET /messages/:id`

Returns one message or `404 Not Found` when it does not exist.

### Delete Message By ID

`DELETE /messages/:id`

Returns `204 No Content` when deleted or `404 Not Found` when it does not exist.

### Reset Messages

`DELETE /messages`

Deletes all stored messages and returns `204 No Content`.

## Statistics

These endpoints exist to support operations: capacity planning, spotting misbehaving clients, and confirming the service is healthy after a deploy.

### Message Stats

`GET /stats/messages`

Purpose: tracks storage growth (`totalStored`, useful for capacity planning) and the ratio of valid to invalid submissions (`submissions`, useful for spotting client-side bugs or misuse — a spike in `invalid` usually means a caller is sending malformed data).

```json
{
  "totalStored": 10,
  "submissions": {
    "valid": 8,
    "invalid": 2
  }
}
```

### Request Stats

`GET /stats/requests`

Purpose: shows overall traffic volume and its breakdown by endpoint (`byType`), which helps identify which operations drive load and informs capacity/scaling decisions.

```json
{
  "total": 25,
  "byType": {
    "GET /health": 5,
    "POST /messages": 10,
    "GET /messages": 8,
    "DELETE /messages/:id": 2
  }
}
```

### Response Stats

`GET /stats/responses`

Purpose: surfaces API health through the distribution of status codes. A rising share of `4xx` responses points to bad client input or usage patterns; a rising share of `5xx` points to server-side problems that need investigation.

```json
{
  "total": 25,
  "byStatusCode": {
    "200": 12,
    "201": 8,
    "400": 3,
    "404": 1,
    "409": 1
  }
}
```

### Service Stats

`GET /stats/service`

Purpose: reports how long the process has been running (`uptimeSeconds`), which is useful for confirming a deploy or restart happened and for basic liveness checks.

```json
{ "uptimeSeconds": 120 }
```

## Data Model

Messages are stored in SQLite with this shape:

```text
id          INTEGER PRIMARY KEY AUTOINCREMENT
message     TEXT NOT NULL UNIQUE
created_at  TEXT NOT NULL
```

API responses expose `created_at` as `createdAt`.

## Logging

The service writes structured JSON logs (one line per event) to stdout, so they can be collected by any container log driver or log aggregator without extra configuration.

- Every request logs a `request completed` event with method, path, status code, and duration.
- Unhandled errors (including malformed JSON bodies), uncaught exceptions, and unhandled promise rejections are logged with the error message and stack trace before the process responds or exits.

## Design Notes

- The API is RESTful and uses JSON request/response bodies.
- SQLite keeps setup portable and avoids requiring an external database.
- The database table is created automatically when the service starts.
- Message IDs are generated by SQLite using an autoincrementing integer primary key.
- Messages are hard-deleted because no audit or recovery requirement was specified.
- Request and response statistics are kept in memory and reset when the service restarts.
- Message totals are read from SQLite so they reflect the current stored data.
