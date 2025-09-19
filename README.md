# Translation System

A modern, collaborative translation management system with AI integration capabilities, designed for professional translators and translation teams.

## 🌟 Features

- **🌐 Browser-based Interface** - Modern web application with responsive design
- **📊 Gridly-like Layout** - Familiar spreadsheet-style interface for translation management
- **👥 Real-time Collaboration** - Multiple users working simultaneously
- **🤖 AI Integration** - Both online and offline AI tools for translation assistance
- **💾 Translation Memory Management** - Import/export TMX and other TM formats
- **📚 Glossary Management** - Import/export terminology databases
- **🔒 Privacy-focused** - Support for offline AI models for complete data privacy

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (installed via Homebrew)
- Redis 6+ (optional for now)
- Docker & Docker Compose (optional)

### Current Status: Week 1 Complete ✅

**The application is currently running and ready for development!**

- **Backend**: `http://localhost:5001` ✅ Running
- **Frontend**: `http://localhost:3000` ✅ Running  
- **Database**: PostgreSQL with test data ✅ Connected

### Test Credentials
- **Admin**: `admin@example.com` / `password123`
- **Translator**: `translator@example.com` / `password123`
- **Reviewer**: `reviewer@example.com` / `password123`

### Current Functionality (Week 1)
- ✅ User authentication (login/register)
- ✅ Database setup with Prisma ORM
- ✅ Basic API endpoints
- ✅ Frontend foundation with React + TypeScript
- ✅ Development environment with hot reload

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/translation-system.git
   cd translation-system
   ```

2. **Start with Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

3. **Or setup manually**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Setup database
   npm run db:setup
   
   # Start development servers
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## 📁 Project Structure

```
translation-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Development environment
└── PROJECT_PLAN.md         # Detailed project plan
```

## 🛠️ Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI (MUI)** for design system
- **Redux Toolkit** for state management
- **AG-Grid** for spreadsheet functionality
- **Socket.io-client** for real-time collaboration

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **PostgreSQL** with Prisma ORM
- **Socket.io** for WebSocket connections
- **Redis** for caching and sessions

### AI Integration
- **Online APIs**: OpenAI GPT-4, DeepL, Google Translate
- **Offline Libraries**: Transformers.js, ONNX Runtime

## 📋 Development Phases

- **Phase 1**: Foundation (Weeks 1-4) - Basic infrastructure and core functionality
- **Phase 2**: Translation Management (Weeks 5-8) - TM/glossary management
- **Phase 3**: AI Integration (Weeks 9-12) - Online and offline AI capabilities
- **Phase 4**: Advanced Features (Weeks 13-16) - Professional features
- **Phase 5**: Deployment & Launch (Weeks 17-20) - Production readiness

## 🔧 Available Scripts

### Root Level
```bash
npm run install:all     # Install all dependencies
npm run dev            # Start all development servers
npm run build          # Build all applications
npm run test           # Run all tests
npm run lint           # Lint all code
npm run db:setup       # Setup database
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data
```

### Frontend
```bash
cd frontend
npm run dev           # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Lint code
```

### Backend
```bash
cd backend
npm run dev           # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Lint code
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

- **Authentication**: JWT-based authentication with refresh tokens
- **Real-time**: WebSocket connections for live collaboration
- **File Formats**: Support for XLIFF, JSON, CSV, Excel, PO, TMX, TBX
- **AI Integration**: RESTful endpoints for translation suggestions

Full API documentation available at `/api/docs` when running the backend.

## 🔒 Security

- **Authentication**: JWT with refresh token rotation
- **Data Encryption**: AES-256 for sensitive data at rest
- **Transport Security**: TLS 1.3 for all communications
- **Access Control**: Role-based permissions with fine-grained controls
- **Audit Trail**: Complete logging of all user actions

## 📊 Performance

- **Page Load Time**: < 2 seconds for initial load
- **API Response Time**: < 500ms for most operations
- **Real-time Latency**: < 100ms for collaboration features
- **Concurrent Users**: Support 100+ simultaneous users per project

## 🌍 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: Responsive design for tablets and phones
- **Progressive Web App**: PWA capabilities for offline usage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/your-username/translation-system/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/your-username/translation-system/discussions)

## 🙏 Acknowledgments

- Inspired by Gridly's user-friendly interface
- Built with modern web technologies
- AI integration powered by leading translation providers

---

**Status**: 🚧 In Development | **Version**: 0.1.0 | **Last Updated**: 2025-01-09
