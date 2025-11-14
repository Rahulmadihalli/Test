# Mehandi Artistry Platform

Full-stack web application for showcasing mehandi styles, managing a design gallery, and handling booking requests. The project is split into a React frontend and a Node.js/Express backend.

## Features

- Public landing page highlighting mehandi types and featured designs.
- Gallery with category filters for photos and videos.
- Booking form that lets customers submit event details and optional design selections.
- Admin dashboard for uploading new designs, reviewing bookings, and managing the gallery.
- Email notifications to the admin when a new booking is submitted (configurable via SMTP).

## Project Structure

```
.
├── backend/          # Express API, file uploads, booking notifications
└── frontend/         # React SPA built with Vite
```

## Prerequisites

- Node.js 18+
- npm 9+

## Backend Setup

```bash
cd backend
npm install
# create backend/.env with settings like:
# PORT=8080
# CLIENT_ORIGIN=http://localhost:3000
# ADMIN_TOKEN=choose_a_secret_token
# SMTP_HOST=...
# SMTP_PORT=...
# SMTP_USER=...
# SMTP_PASS=...
# ADMIN_EMAIL=sheetalgawas27@gmail.com
npm run dev                     # starts Express server on http://localhost:8080
```

> If you cannot copy `.env.example`, create an `.env` file manually with the variables shown in the example inside the backend folder.

## Frontend Setup

```bash
cd frontend
npm install
# copy your mehendi background photo to frontend/public/mehendi-background.jpg
npm run dev                     # launches Vite dev server on http://localhost:3000
```

The Vite dev server proxies API calls (`/api`, `/uploads`) to the backend during development.

## Admin Workflow

1. Visit `http://localhost:3000/admin`.
2. Enter the admin access token (must match `ADMIN_TOKEN` in the backend `.env`) and unlock the dashboard.
3. Use the **Upload Design** form to add new images/videos to the gallery.
4. Review incoming bookings in the **Recent Bookings** panel.
5. Remove designs from the gallery when required.
6. Update the admin access token from the dashboard when you need to rotate credentials.

## Booking Notifications

Configure SMTP credentials in `backend/.env` to automatically send booking details to the admin inbox. If SMTP is not configured, bookings are still stored in `backend/data/bookings.json` and listed in the admin panel.

## Production Considerations

- Swap JSON file storage for a database (MongoDB, PostgreSQL, etc.) for scalability.
- Secure admin routes with authentication.
- Replace the local file upload system with S3/Cloudinary or a CDN-backed service.
- Add form validation and CAPTCHA to reduce spam bookings.

## Scripts

- `backend`: `npm run dev` (with nodemon), `npm start`
- `frontend`: `npm run dev`, `npm run build`, `npm run preview`

## License

This project is provided as-is for demonstration purposes. Customize freely for your own mehandi business.

