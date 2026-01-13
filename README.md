# AI Mock Interview System

An intelligent mock interview platform that uses AI-powered voice interactions to help users practice technical interviews. Built with Next.js, powered by Supabase, and integrated with VAPI for conversational AI.

## 🎯 Features

- **AI-Powered Interviews**: Real-time voice-based mock interviews using VAPI integration
- **User Authentication**: Secure sign-up and sign-in system with Supabase
- **Interview Management**: Create, start, and track mock interviews
- **Technology Selection**: Choose from various tech stacks for specialized interviews
- **Responsive Design**: Mobile-friendly UI with shadcn/ui components
- **Session Middleware**: Secure session management for authenticated users

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with TypeScript
- **Styling**: TailwindCSS + [shadcn/ui](https://ui.shadcn.com/) components
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Voice AI**: [VAPI](https://vapi.ai/) for conversational AI
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toast notifications
- **Linting**: ESLint with modern configuration

## 📁 Project Structure

```
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication routes (sign-in, sign-up)
│   ├── (root)/                   # Main application routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components (button, form, input, etc.)
│   ├── AuthForm.tsx              # Authentication form component
│   ├── InterviewCard.tsx         # Interview card display component
│   └── ...                       # Other shared components
├── lib/                          # Utility functions and helpers
│   ├── actions/                  # Server actions
│   ├── env.ts                    # Environment variable validation
│   ├── session-middleware.ts     # Session management middleware
│   └── utils.ts                  # Helper utilities
├── supabase/                     # Supabase client configuration
│   ├── client.ts                 # Client-side Supabase instance
│   └── server.ts                 # Server-side Supabase instance
├── types/                        # TypeScript type definitions
│   ├── index.d.ts                # General types
│   └── vapi.d.ts                 # VAPI integration types
├── constants/                    # Application constants
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- VAPI account (for voice AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-mock-interview-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # VAPI Configuration
   NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
   
   # Other Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## 📝 Available Scripts

- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## 🔐 Authentication

The application uses Supabase Authentication with the following flow:

1. Users can sign up with email and password
2. Authenticated users access protected routes
3. Session middleware validates user sessions
4. Server-side actions handle secure operations

See [AUTHENTICATION_WORKFLOW.md](docs/AUTHENTICATION_WORKFLOW.md) for detailed authentication flow documentation.

## 🤖 VAPI Integration

The application integrates with VAPI for real-time voice-based AI interviews. VAPI handles:

- Voice input/output processing
- Natural language understanding
- Dynamic conversation management
- Interview feedback and scoring

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components for consistent, accessible UI:

- Button
- Form (with React Hook Form integration)
- Input
- Label
- Toast notifications (Sonner)

## 🔧 Configuration Files

- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `eslint.config.mjs` - ESLint configuration

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [VAPI Documentation](https://docs.vapi.ai/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

## 🚀 Deployment

The application can be deployed on [Vercel](https://vercel.com/) (recommended for Next.js) or any Node.js hosting platform.

### Deploy on Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

For more details, check [Vercel's deployment documentation](https://vercel.com/docs/frameworks/nextjs).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
