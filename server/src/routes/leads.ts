import { Router, Request, Response } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../auth/middleware.js";
import fs from "fs";
import path from "path";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel and CSV files are allowed"));
    }
  },
});

// Upload leads from Excel/CSV
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const tenantId = req.user!.tenantId;
      const filePath = req.file.path;

      // Create upload record
      const uploadRecord = await prisma.leadUpload.create({
        data: {
          tenantId,
          fileName: req.file.originalname,
          totalLeads: 0,
          processedLeads: 0,
          failedLeads: 0,
          status: "PROCESSING",
        },
      });

      // Process file in background
      processLeadsFile(filePath, tenantId, uploadRecord.id, req.file.mimetype);

      res.json({
        message: "File uploaded successfully, processing in background",
        uploadId: uploadRecord.id,
      });
    } catch (error) {
      console.error("Error uploading leads:", error);
      res.status(500).json({ error: "Failed to upload leads" });
    }
  }
);

// Get upload status
router.get(
  "/upload/:uploadId/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.params;
      const tenantId = req.user!.tenantId;

      const upload = await prisma.leadUpload.findFirst({
        where: {
          id: uploadId,
          tenantId,
        },
      });

      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      res.json(upload);
    } catch (error) {
      console.error("Error getting upload status:", error);
      res.status(500).json({ error: "Failed to get upload status" });
    }
  }
);

// Get all leads with filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const {
      page = 1,
      limit = 50,
      search,
      country,
      status,
      industry,
      leadSource,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    if (country) where.country = country;
    if (status) where.status = status;
    if (industry) where.industry = industry;
    if (leadSource) where.leadSource = leadSource;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          emailsSent: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Background function to process uploaded files
async function processLeadsFile(
  filePath: string,
  tenantId: string,
  uploadId: string,
  mimeType: string
) {
  try {
    let leads: any[] = [];

    if (mimeType.includes("sheet") || mimeType.includes("excel")) {
      // Process Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new Error("No worksheet found in Excel file");
      }

      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value).toLowerCase().trim();
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const lead: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          const value = cell.value;

          // Map common column names to our schema
          if (header.includes("name")) lead.name = String(value || "");
          else if (header.includes("email")) lead.email = String(value || "");
          else if (header.includes("phone")) lead.phone = String(value || "");
          else if (header.includes("company"))
            lead.company = String(value || "");
          else if (header.includes("country"))
            lead.country = String(value || "");
          else if (header.includes("state")) lead.state = String(value || "");
          else if (header.includes("city")) lead.city = String(value || "");
          else if (header.includes("industry"))
            lead.industry = String(value || "");
          else if (header.includes("job") || header.includes("title"))
            lead.jobTitle = String(value || "");
          else if (header.includes("source"))
            lead.leadSource = String(value || "");
        });

        if (lead.name && lead.email) {
          leads.push(lead);
        }
      });
    }

    // Save leads to database
    let processedCount = 0;
    let failedCount = 0;

    for (const leadData of leads) {
      try {
        await prisma.lead.create({
          data: {
            ...leadData,
            tenantId,
            status: "NEW",
          },
        });
        processedCount++;
      } catch (error) {
        console.error("Error saving lead:", error);
        failedCount++;
      }
    }

    // Update upload record
    await prisma.leadUpload.update({
      where: { id: uploadId },
      data: {
        totalLeads: leads.length,
        processedLeads: processedCount,
        failedLeads: failedCount,
        status: "COMPLETED",
      },
    });
  } catch (error) {
    console.error("Error processing leads file:", error);
    await prisma.leadUpload.update({
      where: { id: uploadId },
      data: {
        status: "FAILED",
      },
    });
  } finally {
    // Clean up uploaded file
    fs.unlink(filePath, () => {});
  }
}

export default router;
