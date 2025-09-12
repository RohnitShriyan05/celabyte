# Celabyte - AI Database Management Platform

A full-stack SaaS platform for AI-powered database management and querying, built with modern web technologies.

![Celabyte Platform](./docs/images/hero-preview.png)

## 🚀 Features

- **AI-Powered Database Queries**: Natural language to SQL conversion using OpenAI GPT
- **Multi-Database Support**: PostgreSQL, MySQL, MongoDB, and SQLite support
- **Real-time Dashboard**: Interactive dashboard for database monitoring and management
- **Secure Authentication**: JWT-based authentication with Supabase integration
- **Modern UI/UX**: Built with React, TypeScript, and Tailwind CSS
- **RESTful API**: Comprehensive API for database operations and AI queries
- **Docker Ready**: Containerized deployment for easy scaling

## 📁 Project Structure

```
celabyte/
├── client/              # Landing page and marketing site
├── dashboard/           # Main dashboard application
├── server/             # Backend API server
├── docs/               # Documentation and guides
├── docker-compose.yml  # Development environment
├── docker-compose.prod.yml # Production deployment
└── deploy.sh          # Deployment script
```

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Supabase** for authentication and real-time features
- **React Query** for state management

### Backend

- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **PostgreSQL** as primary database
- **OpenAI API** for AI-powered queries
- **JWT** for authentication
- **Docker** for containerization

### DevOps

- **Docker & Docker Compose** for development and deployment
- **ESLint** for code quality
- **Prettier** for code formatting
- **Real-time Results**: Live query execution with proper loading states
- **Query History**: Persistent query history with success/error tracking
- **Data Export**: CSV export functionality for query results
- **Multi-tenant**: Secure tenant isolation and role-based access control
- **Connection Management**: Advanced database connection pooling and health monitoring

## 🏗️ Architecture

```
├── server/          # Node.js/Express backend
│   ├── src/
│   │   ├── ai/      # AI agents (Gemini, OpenAI)
│   │   ├── auth/    # Authentication & authorization
│   │   ├── db/      # Database runners (SQL, Mongo, Excel)
│   │   ├── routes/  # API endpoints
│   │   ├── services/ # Business logic & connection management
│   │   └── middleware/ # Security & validation
│   └── prisma/      # Database schema & migrations
├── dashboard/       # React/TypeScript frontend
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/     # Application pages
│       └── hooks/     # Custom React hooks
└── client/         # Additional client components
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL (for metadata storage)
- Gemini AI API Key or OpenAI API Key

### 1. Backend Setup

```bash
cd server
npm install
```

### 2. Environment Configuration

Create `.env` file in the server directory:

```env
# App Configuration
NODE_ENV=production
PORT=9090
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_ISSUER=https://your-saas.com
JWT_AUDIENCE=https://api.your-saas.com
JWT_HS256_SECRET=your-super-secure-jwt-secret-key-here

# Database (PostgreSQL for metadata)
DATABASE_URL=postgresql://username:password@localhost:5432/celabyte

# AI Provider Configuration
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# Security
SECRETS_BACKEND=env
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### 4. Frontend Setup

```bash
cd ../dashboard
npm install
```

### 5. Start Development

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd dashboard
npm run dev
```

## 🔑 Where to Enter Your Gemini API Key

### Option 1: Environment Variable (Recommended)

Add your Gemini API key to the server `.env` file:

```env
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### Option 2: Direct Configuration

Update `server/src/config/env.ts` if needed, but environment variables are preferred for security.

### Getting a Gemini API Key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 🚀 Production Deployment

### Backend Deployment

```bash
cd server
npm run build
npm start
```

### Frontend Deployment

```bash
cd dashboard
npm run build
# Deploy the dist/ folder to your web server
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=9090
CORS_ORIGIN=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/celabyte?sslmode=require
GEMINI_API_KEY=your-production-gemini-key
JWT_HS256_SECRET=your-production-jwt-secret
```

## 🔒 Security Features

- **Rate Limiting**: Per-tenant request limits
- **Query Complexity Analysis**: Prevents dangerous SQL operations
- **Input Sanitization**: XSS and injection protection
- **Request Timeouts**: Prevents long-running queries
- **Role-Based Access**: VIEWER, ADMIN, OWNER roles
- **Connection Pooling**: Secure database connection management
- **Audit Logging**: Complete query history and error tracking

## 📊 API Endpoints

### Authentication

- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh

### Query Console

- `POST /agent` - Execute natural language query
- `GET /agent/health` - Check AI provider status

### Query Management

- `GET /queries/history` - Get query history
- `GET /queries/stats` - Get query statistics
- `DELETE /queries/:id` - Delete specific query
- `DELETE /queries` - Clear all history

### Database Connections

- `GET /connections` - List tenant connections
- `POST /connections` - Add new connection
- `PUT /connections/:id` - Update connection
- `DELETE /connections/:id` - Remove connection

## 🎯 Usage Examples

### Natural Language Queries

```
"Show me the top 10 customers by revenue"
"Get average order value for the last 7 days"
"Find all users who signed up this month"
"List products with low inventory"
"Show sales trends by category"
```

### Supported Databases

- **PostgreSQL**: Full SQL support with advanced analytics
- **MySQL**: Complete MySQL compatibility
- **MongoDB**: Document queries and aggregations
- **Excel**: Spreadsheet data analysis

## 🔧 Configuration Options

### Security Settings (`server/src/config/security.ts`)

```typescript
export const SECURITY = {
  maxBodyBytes: 256 * 1024, // 256 KB request limit
  queryTimeoutMs: 30_000, // 30 second timeout
  maxLimit: 1000, // Max rows returned
  maxQueryComplexity: 50, // Query complexity threshold
  rateLimitRequests: 100, // Requests per minute per tenant
};
```

### AI Provider Selection

The system automatically uses Gemini AI by default, with OpenAI as fallback. Users can select their preferred provider in the console interface.

## 🐛 Troubleshooting

### Common Issues

1. **"No AI provider configured"**

   - Ensure GEMINI_API_KEY or OPENAI_API_KEY is set in `.env`

2. **Database connection errors**

   - Verify DATABASE_URL is correct
   - Check database is running and accessible

3. **CORS errors**

   - Update CORS_ORIGIN in server `.env` to match frontend URL

4. **Build failures**
   - Run `npm install` in both server and dashboard directories
   - Ensure Node.js version is 18+

### Logs and Monitoring

- Server logs: Check console output for detailed error messages
- Query history: Available in `/queries/history` endpoint
- Connection health: Monitor via `/agent/health` endpoint

## 📈 Performance Optimization

- Connection pooling for database efficiency
- Query result caching (configurable)
- Automatic connection cleanup for idle connections
- Rate limiting to prevent abuse
- Query complexity analysis to block expensive operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review server logs for error details
3. Ensure all environment variables are properly configured
4. Verify database connectivity and AI API keys

---

**Ready to query your data with AI! 🚀**
