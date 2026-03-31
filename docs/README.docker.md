# PrepWise Docker Deployment Guide

## Quick Start

```bash
# 1. Clone and navigate to project
cd ai-mock-interview-system

# 2. Copy environment file
cp .env.production.example .env.production

# 3. Edit .env.production with your credentials

# 4. Build and start containers
docker-compose -f docker-compose.yml up -d --build

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f nextjs-app
docker-compose logs -f python-agent
```

## Production Deployment

### Build without cache (fresh build)
```bash
docker-compose -f docker-compose.yml up -d --build --no-cache
```

### Stop all services
```bash
docker-compose down
```

### Restart services
```bash
docker-compose restart
```

### View resource usage
```bash
docker stats
```

## Environment Variables

### Required for Next.js
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VIDEOSDK_API_KEY` | VideoSDK API key |
| `VIDEOSDK_SECRET_KEY` | VideoSDK secret key |

### Required for Python Agent
| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google Generative AI API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `NEXT_PUBLIC_VIDEOSDK_ROOM_ID` | VideoSDK room ID |
| `NEXT_PUBLIC_VIDEOSDK_TOKEN` | VideoSDK auth token |

## Deployment Platforms

### AWS ECS/EC2
```bash
# Tag images for ECR
docker tag prepwise-nextjs:latest aws-account.dkr.ecr.region.amazonaws.com/prepwise-nextjs:latest
docker tag prepwise-agent:latest aws-account.dkr.ecr.region.amazonaws.com/prepwise-agent:latest

# Push to ECR
docker push aws-account.dkr.ecr.region.amazonaws.com/prepwise-nextjs:latest
docker push aws-account.dkr.ecr.region.amazonaws.com/prepwise-agent:latest
```

### Railway
```bash
# Connect Railway to GitHub repo
# railway init
# railway up
```

### DigitalOcean App Platform
```bash
# Create app with docker-compose
doctl apps create --spec docker-compose.yml
```

### VPS with Docker
```bash
# SSH into VPS
# Install Docker & Docker Compose
# Clone repo
# Set up .env.production
# Run docker-compose up -d
```

## Health Checks

- **Next.js**: `http://localhost:3000/api/health`
- **Agent**: Container health check (Python process)

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs nextjs-app
docker-compose logs python-agent

# Check environment variables
docker-compose config
```

### Out of memory
```bash
# Adjust memory limits in docker-compose.yml
# Or increase Docker Desktop/Engine memory
```

### Build fails
```bash
# Clean build cache
docker builder prune -a
docker-compose build --no-cache
```

## Security Notes

- Never commit `.env.production` to git
- Use secrets management (AWS Secrets Manager, Railway Variables, etc.)
- Regularly update base images
- Run containers as non-root (already configured)
- Enable container security scanning
