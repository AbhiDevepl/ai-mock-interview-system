# 🤖 AI Mock Interview System

A comprehensive, full-stack application designed to help job seekers practice and perfect their interview skills. This system utilizes AI to analyze candidate responses and provide real-time, actionable feedback across a custom-tailored interview environment.

## 🌟 Key Features

*   **Secure Authentication:** Google Sign-In using Firebase Authentication seamlessly integrated with a custom backend stateless JWT with silent refresh token rotation.
*   **Specialized Interview Setups:** Users can configure interview parameters like difficulty, domain (e.g., frontend, backend), and interview style.
*   **Real-time Interview Room:** A focused environment for conducting mock interviews.
*   **Comprehensive Results & Feedback:** Detailed performance reports after each interview session highlighting strengths and areas for improvement.
*   **Dashboard & History:** Personal dashboard to track progress, access past interview histories, and review previous feedback.
*   **Profile Settings:** Manage personal information, preferences, and account configurations.

## 🏗️ Technology Stack

The project is structured entirely as a Monorepo containing a `client` and a `server` application.

### Frontend (`/client`)
*   **Core:** React 19, Vite
*   **Routing:** React Router v7
*   **Styling & UI:** Tailwind CSS v4, Lucide React, react-icons, clsx, tailwind-merge
*   **Forms & Validation:** React Hook Form, Zod
*   **Authentication:** Firebase Auth v12
*   **State / Fetching:** Axios
*   **Notifications:** Sonner

### Backend (`/server`)
*   **Core:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **Authentication:** JSON Web Tokens (JWT), cookie-parser
*   **Middleware:** CORS, dotenv

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

*   **Node.js** (v18+ recommended)
*   **npm** (bundled with Node.js)
*   **MongoDB** database (Local instance or MongoDB Atlas cluster)
*   **Firebase Project** setup (for authentication credentials)

This project uses npm only. Run commands separately inside `client/` and `server/`; there is no package-manager workspace configuration.

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ai-mock-interview-system.git
cd ai-mock-interview-system
```

### 2. Backend Setup

Open a new terminal and navigate to the backend directory:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure the following environment variables:

```env
PORT=8000
MONGODB_URL=mongodb://localhost:27017/ai-mock-interview-system
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Start the backend development server:

```bash
npm run dev
```

The backend should now be running on `http://localhost:5000`.

For production, install production dependencies and start the server with:

```bash
cd server
npm install --omit=dev
npm start
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory and configure your Firebase keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Start the frontend development server:

```bash
npm run dev
```

The application should now be accessible at `http://localhost:5173`.

Build the frontend for production:

```bash
cd client
npm install
npm run build
```

Preview a production build locally:

```bash
cd client
npm run preview
```

## 🧪 Testing

The backend includes a comprehensive validation suite for stateless JWT, Refresh Token Rotation, and logout logic.

To run the tests:

```bash
cd server
npm test
```

```bash
cd client
npm run lint
```

The client has linting configured through npm. There is no `npm test` script in `client/package.json`.

## 📦 NPM Command Reference

### Client

```bash
cd client
npm install
npm run dev
npm run build
npm run lint
```

### Server

```bash
cd server
npm install
npm run dev
npm start
npm test
```

## 📂 Project Structure

```text
ai-mock-interview-system/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application routes/screens (Auth, Dashboard, etc.)
│   │   ├── utils/          # Helper functions (e.g., Firebase config)
│   │   └── App.jsx         # Main application entry
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend application
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # Express API routes
│   ├── controllers/        # Route logic and handlers
│   ├── middleware/         # Custom middleware (e.g., isAuth.js)
│   ├── server.js           # Main backend entry point
│   └── package.json
├── mvp.md                  # Development notes & IDs
├── Dockerfile              # Containerization configuration
└── README.md               # Project documentation
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.
