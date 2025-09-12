# Contributing to Celabyte

Thank you for your interest in contributing to Celabyte! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- Your favorite code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/YourUsername/celabyte.git
   cd celabyte
   ```

2. **Install dependencies**:

   ```bash
   npm run setup
   ```

3. **Start development environment**:

   ```bash
   # Start database
   docker-compose up -d db

   # Start all services
   npm run dev
   ```

4. **Open VS Code workspace** (recommended):
   ```bash
   code .vscode/celabyte.code-workspace
   ```

## 📁 Project Structure

```
celabyte/
├── client/           # Landing page (React + Vite)
├── dashboard/        # Main app (React + TypeScript)
├── server/          # API server (Node.js + Express)
├── docs/            # Documentation
├── .vscode/         # VS Code configuration
└── scripts/         # Build and deployment scripts
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:

   ```bash
   # Run linting
   npm run lint

   # Run tests
   npm run test

   # Build to check for errors
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
```

## 🎨 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new code
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions
- Prefer functional components in React

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow the existing folder structure

### CSS/Styling

- Use Tailwind CSS utility classes
- Create custom components in the `ui/` folder
- Follow mobile-first responsive design
- Use CSS variables for theming

### Backend API

- Use RESTful conventions
- Add proper error handling
- Validate input data with Zod
- Add rate limiting for public endpoints
- Document endpoints with JSDoc

## 🧪 Testing

### Frontend Testing

```bash
# Run client tests
cd client && npm run test

# Run dashboard tests
cd dashboard && npm run test
```

### Backend Testing

```bash
# Run server tests
cd server && npm run test
```

### E2E Testing

```bash
# Run end-to-end tests
npm run test:e2e
```

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for all public functions
- Include type annotations
- Document complex logic with inline comments

### API Documentation

- Update OpenAPI specs for new endpoints
- Include example requests/responses
- Document error codes and messages

### User Documentation

- Update README.md for new features
- Add screenshots for UI changes
- Update deployment guides if needed

## 🔍 Code Review Process

### Before Submitting PR

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] No console.log statements left
- [ ] Environment variables are documented

### PR Requirements

- Clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Add breaking change notes if applicable

## 🐛 Bug Reports

### Before Reporting

- Check existing issues
- Reproduce the bug
- Test with latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. Windows, macOS, Linux]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 🚢 Deployment

### Development Deployment

```bash
# Start development environment
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy with Docker
./deploy.sh
```

## 📚 Resources

### Learning Resources

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Project Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🤝 Community

### Communication Channels

- 💬 Discord: [Join our community](https://discord.gg/celabyte)
- 📧 Email: developers@celabyte.com
- 🐛 Issues: [GitHub Issues](https://github.com/RohnitShriyan05/celabyte/issues)

### Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for major contributions
- Annual contributor spotlight

Thank you for contributing to Celabyte! 🎉
