import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../auth/middleware.js";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).optional(),
});

const updateTemplateSchema = templateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Get all email templates
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { page = 1, limit = 20, search, isActive } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    // Parse variables JSON for each template
    const templatesWithParsedVars = templates.map((template: any) => ({
      ...template,
      variables: JSON.parse(template.variables || "[]"),
    }));

    res.json({
      templates: templatesWithParsedVars,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
});

// Get single email template
router.get("/:templateId", authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const tenantId = req.user!.tenantId;

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
      },
      include: {
        emailsSent: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({
      ...template,
      variables: JSON.parse(template.variables || "[]"),
    });
  } catch (error) {
    console.error("Error fetching email template:", error);
    res.status(500).json({ error: "Failed to fetch email template" });
  }
});

// Create new email template
router.post("/", authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = templateSchema.parse(req.body);

    // Check if template name already exists
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: validatedData.name,
        tenantId,
      },
    });

    if (existingTemplate) {
      return res
        .status(400)
        .json({ error: "Template with this name already exists" });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        variables: JSON.stringify(validatedData.variables || []),
        tenantId,
      },
    });

    res.status(201).json({
      ...template,
      variables: JSON.parse(template.variables),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating email template:", error);
    res.status(500).json({ error: "Failed to create email template" });
  }
});

// Update email template
router.put("/:templateId", authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const tenantId = req.user!.tenantId;
    const validatedData = updateTemplateSchema.parse(req.body);

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== existingTemplate.name) {
      const duplicateTemplate = await prisma.emailTemplate.findFirst({
        where: {
          name: validatedData.name,
          tenantId,
          id: { not: templateId },
        },
      });

      if (duplicateTemplate) {
        return res
          .status(400)
          .json({ error: "Template with this name already exists" });
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.variables) {
      updateData.variables = JSON.stringify(validatedData.variables);
    }

    const template = await prisma.emailTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    res.json({
      ...template,
      variables: JSON.parse(template.variables),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating email template:", error);
    res.status(500).json({ error: "Failed to update email template" });
  }
});

// Delete email template
router.delete("/:templateId", authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const tenantId = req.user!.tenantId;

    const deletedTemplate = await prisma.emailTemplate.deleteMany({
      where: {
        id: templateId,
        tenantId,
      },
    });

    if (deletedTemplate.count === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
});

// Preview template with sample data
router.post("/:templateId/preview", authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const tenantId = req.user!.tenantId;
    const { sampleData = {} } = req.body;

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Replace template variables with sample data
    let previewSubject = template.subject;
    let previewContent = template.content;

    const variables = JSON.parse(template.variables || "[]");
    variables.forEach((variable: string) => {
      const value = sampleData[variable] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, "g");
      previewSubject = previewSubject.replace(regex, value);
      previewContent = previewContent.replace(regex, value);
    });

    res.json({
      subject: previewSubject,
      content: previewContent,
      variables: variables,
      sampleData,
    });
  } catch (error) {
    console.error("Error previewing email template:", error);
    res.status(500).json({ error: "Failed to preview email template" });
  }
});

// Clone template
router.post("/:templateId/clone", authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const tenantId = req.user!.tenantId;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: "New template name is required" });
    }

    const originalTemplate = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
      },
    });

    if (!originalTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if new name already exists
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: newName,
        tenantId,
      },
    });

    if (existingTemplate) {
      return res
        .status(400)
        .json({ error: "Template with this name already exists" });
    }

    const clonedTemplate = await prisma.emailTemplate.create({
      data: {
        name: newName,
        subject: originalTemplate.subject,
        content: originalTemplate.content,
        variables: originalTemplate.variables,
        tenantId,
        isActive: false, // Start as inactive
      },
    });

    res.status(201).json({
      ...clonedTemplate,
      variables: JSON.parse(clonedTemplate.variables),
    });
  } catch (error) {
    console.error("Error cloning email template:", error);
    res.status(500).json({ error: "Failed to clone email template" });
  }
});

export default router;
