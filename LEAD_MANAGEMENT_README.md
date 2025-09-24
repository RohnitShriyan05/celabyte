# Lead Management System

This application has been transformed into a comprehensive lead management system with AI-powered email campaigns.

## Features

### 1. Lead Management

- **Excel/CSV Upload**: Upload lead data from spreadsheet files
- **Lead Database**: Store and manage lead information including:
  - Name, Email, Phone, Company
  - Location (Country, State, City)
  - Industry, Job Title, Lead Source
  - Custom fields and tags
  - Lead status tracking (NEW, CONTACTED, QUALIFIED, etc.)
- **Search & Filtering**: Advanced filtering by country, industry, status, etc.
- **Export Functionality**: Export filtered leads to Excel files

### 2. Email Templates

- **Template Management**: Create, edit, and manage email templates
- **Variable Support**: Use dynamic variables like {{name}}, {{company}}, {{country}}
- **Template Examples**: Pre-built templates for welcome, follow-up, and holiday emails
- **Preview Mode**: Preview how emails will look with sample data
- **Template Cloning**: Duplicate and modify existing templates

### 3. AI-Powered Email Campaigns

- **Natural Language Criteria**: Describe your target audience in plain English
  - "Send to all people in India"
  - "Send to all CEOs and CTOs"
  - "Send to all technology companies"
- **Smart Lead Matching**: AI interprets your criteria and finds matching leads
- **Personalized Emails**: Automatically replace template variables with lead data
- **Test Mode**: Preview matching leads before sending emails
- **Campaign Analytics**: Track email delivery, success rates, and performance

### 4. Email Analytics

- **Delivery Tracking**: Monitor sent, failed, and bounced emails
- **Template Performance**: See which templates perform best
- **Daily Activity**: View email sending activity over time
- **Success Rates**: Track campaign effectiveness

## Setup Instructions

### 1. Server Setup

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `JWT_SECRET`: Secret key for authentication
- `GEMINI_API_KEY`: Google Gemini AI API key for natural language processing
- `SMTP_*`: Email server configuration (Gmail, SendGrid, etc.)
- `DATABASE_URL`: SQLite database path (default: file:./prisma/dev.db)

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create/update database
npx prisma db push
```

### 4. Client Setup

```bash
cd dashboard
npm install
```

### 5. Start Development Servers

```bash
# Start server (from /server directory)
npm run dev

# Start client (from /dashboard directory)
npm run dev
```

## Usage Guide

### Uploading Leads

1. Go to **Lead Management** → **Upload Leads** tab
2. Drag & drop or select your Excel/CSV file
3. Ensure your file has columns like: Name, Email, Company, Country, etc.
4. Monitor upload progress and results

### Creating Email Templates

1. Go to **Email Templates**
2. Click "New Template"
3. Use the template editor or choose from examples
4. Add variables using {{variableName}} syntax
5. Preview your template before saving

### Sending Campaigns

1. Go to **Email Campaigns**
2. Select an email template
3. Enter your criteria in natural language:
   - "Send to all people in India with the template named 'festive'"
   - "Send to all CEOs in technology companies"
4. Use Test Mode to preview matching leads
5. Send the campaign when ready

### Supported Lead Data Columns

- **Name** (required)
- **Email** (required)
- Phone
- Company
- Country
- State
- City
- Industry
- Job Title
- Lead Source

### Email Template Variables

Use these variables in your templates:

- `{{name}}` - Lead's name
- `{{email}}` - Lead's email
- `{{company}}` - Company name
- `{{country}}` - Country
- `{{state}}` - State/Province
- `{{city}}` - City
- `{{industry}}` - Industry
- `{{jobTitle}}` - Job title
- `{{leadSource}}` - Lead source
- `{{phone}}` - Phone number

### AI Campaign Examples

- "Send welcome email to all new leads"
- "Send follow-up to all people in USA working in healthcare"
- "Send holiday greetings to all leads from last month"
- "Send to all CTOs and technical leads in software companies"
- "Send to all uncontacted leads in Europe"

## API Endpoints

### Leads

- `POST /api/leads/upload` - Upload lead file
- `GET /api/leads` - List leads with filtering
- `GET /api/leads/stats` - Get lead statistics
- `PATCH /api/leads/:id` - Update lead status
- `POST /api/leads/export` - Export leads to Excel

### Email Templates

- `GET /api/email-templates` - List templates
- `POST /api/email-templates` - Create template
- `PUT /api/email-templates/:id` - Update template
- `DELETE /api/email-templates/:id` - Delete template
- `POST /api/email-templates/:id/clone` - Clone template

### Email Campaigns

- `POST /api/email-campaigns/send` - Send AI campaign
- `GET /api/email-campaigns/logs` - Get email logs
- `GET /api/email-campaigns/analytics` - Get campaign analytics

## Database Schema

The system uses the following main models:

- **Lead**: Stores lead information and status
- **EmailTemplate**: Email templates with variables
- **EmailLog**: Tracks sent emails and their status
- **LeadUpload**: Tracks file upload progress

## Technology Stack

### Backend

- Node.js + Express
- Prisma ORM with SQLite
- Google Gemini AI for natural language processing
- Nodemailer for email sending
- ExcelJS for spreadsheet processing
- Multer for file uploads

### Frontend

- React + TypeScript
- React Router for navigation
- React Dropzone for file uploads
- Tailwind CSS for styling
- Radix UI components
- XLSX.js for client-side Excel processing

## Security Features

- JWT authentication
- Request rate limiting
- File upload validation
- SQL injection prevention via Prisma
- Email template sanitization

## Deployment

The system can be deployed using:

- Docker (see docker-compose.yml)
- Traditional hosting with Node.js
- Cloud platforms (AWS, GCP, Azure)

Make sure to:

1. Configure production environment variables
2. Use a production database (PostgreSQL recommended)
3. Set up proper email service (SendGrid, AWS SES, etc.)
4. Configure HTTPS
5. Set up monitoring and logging
