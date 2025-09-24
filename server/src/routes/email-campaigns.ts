import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../auth/middleware.js';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const sendEmailSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  criteria: z.string().min(1, 'Criteria is required'),
  testMode: z.boolean().optional()
});

// Configure nodemailer transporter (you'll need to configure this with your email provider)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// AI-powered email sending
router.post('/send', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { templateName, criteria, testMode = false } = sendEmailSchema.parse(req.body);

    // Get the email template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name: templateName,
        tenantId,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found or inactive' });
    }

    // Use AI to interpret the criteria and build a query
    const leads = await getLeadsBasedOnCriteria(tenantId, criteria);

    if (leads.length === 0) {
      return res.json({
        message: 'No leads found matching the criteria',
        criteria,
        matchedLeads: 0
      });
    }

    // If test mode, just return the matched leads without sending emails
    if (testMode) {
      return res.json({
        message: 'Test mode: These leads would receive emails',
        criteria,
        matchedLeads: leads.length,
        leads: leads.slice(0, 10), // Show first 10 leads
        template: {
          name: template.name,
          subject: template.subject
        }
      });
    }

    // Send emails to matched leads
    const transporter = createTransporter();
    const results = [];

    for (const lead of leads) {
      try {
        // Replace template variables with lead data
        const personalizedSubject = replaceTemplateVariables(template.subject, lead);
        const personalizedContent = replaceTemplateVariables(template.content, lead);

        // Send email
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: lead.email,
          subject: personalizedSubject,
          html: personalizedContent
        });

        // Log successful send
        await prisma.emailLog.create({
          data: {
            tenantId,
            leadId: lead.id,
            templateId: template.id,
            subject: personalizedSubject,
            content: personalizedContent,
            status: 'SENT',
            sentAt: new Date()
          }
        });

        results.push({
          leadId: lead.id,
          email: lead.email,
          status: 'sent',
          messageId: info.messageId
        });

        // Update lead status to CONTACTED
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'CONTACTED' }
        });

      } catch (emailError) {
        console.error(`Error sending email to ${lead.email}:`, emailError);

        // Log failed send
        await prisma.emailLog.create({
          data: {
            tenantId,
            leadId: lead.id,
            templateId: template.id,
            subject: template.subject,
            content: template.content,
            status: 'FAILED',
            errorMsg: emailError instanceof Error ? emailError.message : 'Unknown error'
          }
        });

        results.push({
          leadId: lead.id,
          email: lead.email,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.json({
      message: `Email campaign completed`,
      criteria,
      totalLeads: leads.length,
      sent: sentCount,
      failed: failedCount,
      results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Get email logs
router.get('/logs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { page = 1, limit = 50, status, templateId, leadId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { tenantId };

    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (leadId) where.leadId = leadId;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: {
              name: true,
              email: true,
              company: true
            }
          },
          template: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.emailLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// Get email analytics
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      totalEmails,
      sentEmails,
      failedEmails,
      templateStats,
      dailyStats
    ] = await Promise.all([
      prisma.emailLog.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.emailLog.count({
        where: {
          tenantId,
          status: 'SENT',
          createdAt: { gte: startDate }
        }
      }),
      prisma.emailLog.count({
        where: {
          tenantId,
          status: 'FAILED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.emailLog.groupBy({
        by: ['templateId'],
        where: {
          tenantId,
          createdAt: { gte: startDate }
        },
        _count: true,
        orderBy: { _count: { templateId: 'desc' } },
        take: 10
      }),
      // Daily email stats for the chart
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
        FROM EmailLog 
        WHERE tenantId = ${tenantId}
          AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Get template names for stats
    const templateIds = templateStats.map(stat => stat.templateId).filter(Boolean);
    const templates = await prisma.emailTemplate.findMany({
      where: {
        id: { in: templateIds as string[] }
      },
      select: {
        id: true,
        name: true
      }
    });

    const templateStatsWithNames = templateStats.map(stat => ({
      ...stat,
      templateName: templates.find(t => t.id === stat.templateId)?.name || 'Unknown'
    }));

    res.json({
      summary: {
        totalEmails,
        sentEmails,
        failedEmails,
        successRate: totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0
      },
      templateStats: templateStatsWithNames,
      dailyStats,
      period
    });
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    res.status(500).json({ error: 'Failed to fetch email analytics' });
  }
});

// Helper function to interpret natural language criteria using AI
async function getLeadsBasedOnCriteria(tenantId: string, criteria: string) {
  try {
    // Use AI to interpret the criteria and suggest a database query
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    You are a lead filtering assistant. Given a natural language criteria, you need to convert it into a Prisma where clause.
    
    Available lead fields:
    - name (string)
    - email (string) 
    - phone (string)
    - company (string)
    - country (string)
    - state (string)
    - city (string)
    - industry (string)
    - jobTitle (string)
    - leadSource (string)
    - status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)
    - tags (JSON array)
    - customFields (JSON object)
    
    Criteria: "${criteria}"
    
    Return ONLY a JSON object that can be used as a Prisma where clause. No explanation, just the JSON.
    
    Examples:
    "people in India" -> {"country": {"equals": "India", "mode": "insensitive"}}
    "tech companies" -> {"industry": {"contains": "tech", "mode": "insensitive"}}
    "new leads from last week" -> {"status": "NEW"}
    "people with CEO or CTO title" -> {"OR": [{"jobTitle": {"contains": "CEO", "mode": "insensitive"}}, {"jobTitle": {"contains": "CTO", "mode": "insensitive"}}]}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const whereClause = JSON.parse(response.text().trim());

    // Add tenantId to the where clause
    const finalWhere = {
      tenantId,
      ...whereClause
    };

    // Execute the query
    const leads = await prisma.lead.findMany({
      where: finalWhere,
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to prevent overwhelming email sends
    });

    return leads;

  } catch (error) {
    console.error('Error interpreting criteria with AI:', error);
    
    // Fallback: simple text-based matching
    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: criteria, mode: 'insensitive' } },
          { company: { contains: criteria, mode: 'insensitive' } },
          { country: { contains: criteria, mode: 'insensitive' } },
          { industry: { contains: criteria, mode: 'insensitive' } },
          { jobTitle: { contains: criteria, mode: 'insensitive' } }
        ]
      },
      take: 1000
    });

    return leads;
  }
}

// Helper function to replace template variables with lead data
function replaceTemplateVariables(template: string, lead: any): string {
  let result = template;
  
  // Replace common variables
  result = result.replace(/{{name}}/g, lead.name || '');
  result = result.replace(/{{email}}/g, lead.email || '');
  result = result.replace(/{{company}}/g, lead.company || '');
  result = result.replace(/{{country}}/g, lead.country || '');
  result = result.replace(/{{state}}/g, lead.state || '');
  result = result.replace(/{{city}}/g, lead.city || '');
  result = result.replace(/{{industry}}/g, lead.industry || '');
  result = result.replace(/{{jobTitle}}/g, lead.jobTitle || '');
  result = result.replace(/{{leadSource}}/g, lead.leadSource || '');
  result = result.replace(/{{phone}}/g, lead.phone || '');
  
  // Replace custom fields if they exist
  if (lead.customFields) {
    try {
      const customFields = JSON.parse(lead.customFields);
      Object.keys(customFields).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, customFields[key] || '');
      });
    } catch (error) {
      console.error('Error parsing custom fields:', error);
    }
  }
  
  return result;
}

export default router;
