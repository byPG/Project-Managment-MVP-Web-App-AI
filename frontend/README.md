# Kanban Frontend

A single-board Kanban web application built with Next.js and React.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server locally:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

3. Run the development server for local network access:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Other computers on the local network can access the server using `http://<host-ip-address>:3000`.

## Testing

Run unit tests:
```bash
npm test
```

Run Playwright end-to-end tests:
```bash
npm run test:e2e
```
