# Contributing to Translation System

We love your input! We want to make contributing to Translation System as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/translation-system.git
   cd translation-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run docker:up
   # or manually:
   npm run dev
   ```

## Code Style

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting. The configuration is included in the project.

```bash
npm run lint:fix
```

### Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting, missing semi colons, etc
- `refactor:` refactoring production code
- `test:` adding tests
- `chore:` updating build tasks, package manager configs, etc

Examples:
```
feat: add translation memory import functionality
fix: resolve real-time collaboration cursor sync issue
docs: update API documentation for AI endpoints
```

## Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm run test
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

## Pull Request Guidelines

### Before Submitting

- [ ] Run the test suite and ensure all tests pass
- [ ] Run the linter and fix any issues
- [ ] Update documentation if needed
- [ ] Add tests for new functionality
- [ ] Ensure your branch is up to date with `main`

### PR Template

When creating a pull request, please include:

1. **Description**: What does this PR do?
2. **Type of change**: Bug fix, feature, documentation, etc.
3. **Testing**: How was this tested?
4. **Checklist**: Confirm you've completed the necessary steps

### Code Review Process

1. All submissions require review from maintainers
2. Address any feedback promptly
3. Keep PRs focused and atomic
4. Rebase on main before merging

## Issue Guidelines

### Bug Reports

When filing a bug report, please include:

1. **Clear title**: Brief description of the issue
2. **Steps to reproduce**: How can we reproduce this?
3. **Expected behavior**: What should happen?
4. **Actual behavior**: What actually happens?
5. **Environment**: OS, browser, Node version, etc.
6. **Screenshots**: If applicable

### Feature Requests

For feature requests, please include:

1. **Problem**: What problem does this solve?
2. **Solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Additional context**: Any other relevant information

## Development Guidelines

### Architecture

- **Frontend**: React with TypeScript, Redux Toolkit for state management
- **Backend**: Node.js with Express, PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for WebSocket connections
- **AI Integration**: Modular approach supporting multiple providers

### Code Organization

```
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── store/         # Redux store and slices
├── services/      # API services
└── utils/         # Utility functions

backend/src/
├── controllers/   # Route controllers
├── models/        # Database models (Prisma)
├── routes/        # API routes
├── middleware/    # Express middleware
├── services/      # Business logic
└── utils/         # Utility functions
```

### Database Changes

1. Create a new migration: `npm run db:migrate --prefix backend`
2. Update the Prisma schema in `backend/prisma/schema.prisma`
3. Generate the client: `npm run db:generate --prefix backend`
4. Test the changes thoroughly

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Include comprehensive error handling
- Document all endpoints
- Version your API (`/api/v1/...`)

### Security

- Never commit secrets or API keys
- Validate all input data
- Use proper authentication and authorization
- Follow OWASP security guidelines
- Regular dependency updates

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. Update version numbers in `package.json` files
2. Update `CHANGELOG.md`
3. Create a release tag
4. Deploy to staging for testing
5. Deploy to production
6. Announce the release

## Community Guidelines

### Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). Please be respectful and inclusive in all interactions.

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the `docs/` folder first

### Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Translation System! 🚀
