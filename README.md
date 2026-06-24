# ROVE Hire

ROVE Hire is a Next.js internal recruitment tool for managing candidates from resume intake through candidate form submission. This implementation currently covers features 1 through 4 from the assignment brief.

## Test HR Login

- Email: `hr@rovedashcam.com`
- Password: `rovehire`

## Tech Choices

The app uses Next.js App Router with server actions and route handlers so the HR and public candidate experiences can live in one deployable codebase. For this assignment slice, data is persisted in a JSON file and uploads are stored on disk, which keeps the product easy to review locally; for production I would move these to Postgres and object storage.

## Run Locally

```bash
npm install
npm run dev
```
