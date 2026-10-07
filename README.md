# Student Management CRUD App

A beginner-friendly full-stack application built for the CRUD App with Database task.

## Features

- Create, read, update, and delete student records.
- Frontend communicates with the Express API using `fetch`.
- SQLite database stores student records in `students.db`.
- API validates names, email addresses, departments, IDs, and duplicate email addresses.
- Database is saved to disk after each write, so records remain after the server restarts.
- Responsive layout for desktop and mobile.

## Technology

- Frontend: HTML, CSS, JavaScript
- API: Node.js and Express
- Database: SQLite powered by `sql.js`

## Database schema

`students` table:

| Column | Type | Rule |
|---|---|---|
| id | INTEGER | Primary key, auto-increment |
| name | TEXT | Required, 2–60 characters |
| email | TEXT | Required, unique |
| department | TEXT | Required, 2–50 characters |
| created_at | TEXT | Required, ISO timestamp |

## Requirements

Install Node.js (LTS) from https://nodejs.org/.

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the app:

   ```bash
   npm start
   ```

6. Open http://localhost:3000 in your browser.

The first run creates `students.db`. The app writes database changes to this file. Keep the file in the project folder if you want to preserve your local records.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List all students |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Add a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

### Example request body

```json
{
  "name": "Priya Kumar",
  "email": "priya@example.com",
  "department": "Computer Science"
}
```

Invalid input returns an HTTP 400 response. Duplicate email addresses return HTTP 409, and a missing student returns HTTP 404.

## Test persistence

1. Add a student through the web page.
2. Stop the server with `Ctrl + C`.
3. Run `npm start` again.
4. Refresh the page. The student record should still be present.

## GitHub submission

Create a **public** repository named `CRUD-App-Database`, upload these project files, and submit the repository URL. Do not upload `node_modules`. The generated `students.db` is a local runtime database file and can be left out of the repository; it is created when the app starts.
