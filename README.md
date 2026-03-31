# PrepWise - AI Mock Interview System

An intelligent mock interview platform powered by AI that helps users practice job interviews with realistic voice-based interactions.

## Features

- **AI-Powered Voice Interviews** - Practice with conversational AI that simulates real interview scenarios
- **Multiple Interview Types** - Support for various roles (backend, frontend, internship) and technologies
- **Real-time Feedback** - Get immediate responses and evaluation from AI
- **User Authentication** - Secure sign-up and sign-in with Supabase
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (React 19) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Database | Supabase |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-mock-interview-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   └── (root)/            # Main application pages
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities and server actions
├── supabase/             # Supabase client configuration
├── types/                # TypeScript definitions
└── constants/            # Application constants
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |


MIT License
