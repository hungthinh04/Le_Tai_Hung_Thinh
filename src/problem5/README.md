# Problem 5: A Crude Server

CRUD backend server built with ExpressJS and TypeScript.

## Installation

```bash
cd src/problem5
npm install
```

## Running

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Create resource

POST `/api/resources`

```json
{
  "name": "Resource Name",
  "description": "Optional description",
  "status": "active"
}
```

### List resources

GET `/api/resources`
Query params: `status`, `search`, `limit`, `offset`

### Get resource

GET `/api/resources/:id`

### Update resource

PUT `/api/resources/:id`

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "inactive"
}
```

### Delete resource

DELETE `/api/resources/:id`

## Database

Uses SQLite database (`database.db`). Database is automatically created on first run.

## Testing with Postman

### Setup

1. Open Postman
2. Create a new collection named "CRUD Server"
3. Set base URL: `http://localhost:3000`

### Test Cases

#### 1. Health Check

**Request:**

- Method: `GET`
- URL: `http://localhost:3000/health`

**Expected Response:**

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### 2. Create Resource

**Request:**

- Method: `POST`
- URL: `http://localhost:3000/api/resources`
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "name": "My First Resource",
  "description": "This is a test resource",
  "status": "active"
}
```

**Expected Response (201):**

```json
{
  "message": "Resource created successfully",
  "data": {
    "id": 1,
    "name": "My First Resource",
    "description": "This is a test resource",
    "status": "active",
    "createdAt": "2024-01-01 12:00:00",
    "updatedAt": "2024-01-01 12:00:00"
  }
}
```

**Test Cases:**

- Create resource with only name (description and status optional)
- Create resource without name (should return 400 error)

#### 3. List Resources

**Request:**

- Method: `GET`
- URL: `http://localhost:3000/api/resources`

**With Filters:**

- Filter by status: `http://localhost:3000/api/resources?status=active`
- Search by name/description: `http://localhost:3000/api/resources?search=test`
- Pagination: `http://localhost:3000/api/resources?limit=10&offset=0`
- Combined: `http://localhost:3000/api/resources?status=active&search=test&limit=10&offset=0`

**Expected Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "My First Resource",
      "description": "This is a test resource",
      "status": "active",
      "createdAt": "2024-01-01 12:00:00",
      "updatedAt": "2024-01-01 12:00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

#### 4. Get Resource by ID

**Request:**

- Method: `GET`
- URL: `http://localhost:3000/api/resources/1`

**Expected Response (200):**

```json
{
  "data": {
    "id": 1,
    "name": "My First Resource",
    "description": "This is a test resource",
    "status": "active",
    "createdAt": "2024-01-01 12:00:00",
    "updatedAt": "2024-01-01 12:00:00"
  }
}
```

**Error Cases:**

- Invalid ID: `http://localhost:3000/api/resources/abc` (should return 400)
- Non-existent ID: `http://localhost:3000/api/resources/999` (should return 404)

#### 5. Update Resource

**Request:**

- Method: `PUT`
- URL: `http://localhost:3000/api/resources/1`
- Headers: `Content-Type: application/json`
- Body (raw JSON) - all fields optional:

```json
{
  "name": "Updated Resource Name",
  "description": "Updated description",
  "status": "inactive"
}
```

**Expected Response (200):**

```json
{
  "message": "Resource updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Resource Name",
    "description": "Updated description",
    "status": "inactive",
    "createdAt": "2024-01-01 12:00:00",
    "updatedAt": "2024-01-01 12:01:00"
  }
}
```

**Test Cases:**

- Update only name
- Update only status
- Update all fields
- Update non-existent resource (should return 404)

#### 6. Delete Resource

**Request:**

- Method: `DELETE`
- URL: `http://localhost:3000/api/resources/1`

**Expected Response (200):**

```json
{
  "message": "Resource deleted successfully"
}
```

**Error Cases:**

- Delete non-existent resource (should return 404)
- Delete with invalid ID (should return 400)

### Postman Collection Setup

1. Create environment variable:

   - Variable: `base_url`
   - Value: `http://localhost:3000`

2. Use variables in requests:

   - URL: `{{base_url}}/api/resources`

3. Save requests in collection for easy testing

### Testing Workflow

1. Start the server: `npm run dev`
2. Test health check endpoint
3. Create a few resources (POST)
4. List all resources (GET)
5. Get a specific resource (GET by ID)
6. Update a resource (PUT)
7. List resources with filters
8. Delete a resource (DELETE)
9. Verify deletion by trying to get deleted resource (should return 404)
