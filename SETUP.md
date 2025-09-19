# Quick Setup Guide

This guide will help you get the Translation System up and running quickly.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL 14+ (if not using Docker)
- Redis 6+ (if not using Docker)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/translation-system.git
cd translation-system

# Install all dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# At minimum, set your database and Redis URLs
```

### 3. Start Development Environment

**Option A: Using Docker (Recommended)**
```bash
# Start all services with Docker
npm run docker:up

# Check logs if needed
npm run docker:logs
```

**Option B: Manual Setup**
```bash
# Start PostgreSQL and Redis manually, then:
npm run db:setup
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Available Scripts

### Root Level Commands
```bash
npm run install:all     # Install all dependencies
npm run dev            # Start all development servers
npm run build          # Build all applications
npm run test           # Run all tests
npm run lint           # Lint all code
npm run docker:up      # Start Docker environment
npm run docker:down    # Stop Docker environment
```

### Frontend Commands
```bash
cd frontend
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Lint code
```

### Backend Commands
```bash
cd backend
npm run dev           # Start with tsx watch
npm run build         # Build TypeScript
npm run test          # Run tests
npm run db:setup      # Setup database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed with sample data
```

## Development Workflow

### 1. Database Changes
```bash
# Edit schema in backend/prisma/schema.prisma
# Generate migration
npm run db:migrate --prefix backend

# Push changes (development)
npm run db:push --prefix backend
```

### 2. API Development
- Controllers: `backend/src/controllers/`
- Routes: `backend/src/routes/`
- Services: `backend/src/services/`
- Models: `backend/prisma/schema.prisma`

### 3. Frontend Development
- Components: `frontend/src/components/`
- Pages: `frontend/src/pages/`
- State: `frontend/src/store/`
- Services: `frontend/src/services/`

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill processes on ports 3000, 5000, 5432, 6379
lsof -ti:3000,5000,5432,6379 | xargs kill -9
```

**Database connection issues**
```bash
# Reset database
npm run db:reset --prefix backend

# Or restart Docker containers
npm run docker:down
npm run docker:up
```

**Node modules issues**
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

### Docker Issues

**Container won't start**
```bash
# Check logs
npm run docker:logs

# Rebuild containers
npm run docker:down
npm run docker:build
npm run docker:up
```

**Database data lost**
```bash
# Remove volumes and restart
npm run docker:down
docker volume rm translation-system_postgres_data
npm run docker:up
```

## Production Deployment

### Environment Variables
Update `.env` for production:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/translation_system
REDIS_URL=redis://prod-redis:6379
CORS_ORIGIN=https://your-domain.com
```

### Build and Deploy
```bash
# Build applications
npm run build

# Start production server
cd backend && npm start
```

## Getting Help

- **Documentation**: Check the `docs/` folder
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## Next Steps

1. **Phase 1**: Set up authentication and basic UI
2. **Phase 2**: Implement translation grid interface
3. **Phase 3**: Add real-time collaboration
4. **Phase 4**: Integrate AI translation services
5. **Phase 5**: Add file import/export functionality

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed implementation phases.
