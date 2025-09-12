import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';
import { hashPassword, verifyPassword } from '../auth/password';

const router = Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: {
          include: {
            notificationPrefs: true,
            emailPrefs: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// Update profile
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

router.put('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const data = updateProfileSchema.parse(req.body);
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.locale !== undefined) updateData.locale = data.locale;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userSettings: {
          include: {
            notificationPrefs: true,
            emailPrefs: true
          }
        }
      }
    });
    
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

router.post('/change-password', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    next(e);
  }
});

// Get user settings
router.get('/settings', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get or create user settings with default values
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: 'system',
        notificationPrefs: {
          create: {
            email: true,
            push: true,
            desktop: true
          }
        },
        emailPrefs: {
          create: {
            marketing: true,
            productUpdates: true,
            securityAlerts: true
          }
        }
      },
      update: {},
      include: {
        notificationPrefs: true,
        emailPrefs: true
      }
    });
    
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

// Update user settings
const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    desktop: z.boolean().optional(),
  }).optional(),
  emailPreferences: z.object({
    marketing: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
  }).optional(),
});

router.put('/settings', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSettingsSchema.parse(req.body);
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user exists and get current settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: {
          include: {
            notificationPrefs: true,
            emailPrefs: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (data.theme) updateData.theme = data.theme;
    
    // Handle nested updates
    const nestedUpdates = [];
    
    if (data.notifications) {
      if (user.userSettings?.notificationPrefs) {
        nestedUpdates.push(
          prisma.notificationPreferences.update({
            where: { id: user.userSettings.notificationPrefs.id },
            data: data.notifications
          })
        );
      } else {
        updateData.notificationPrefs = {
          create: data.notifications
        };
      }
    }
    
    if (data.emailPreferences) {
      if (user.userSettings?.emailPrefs) {
        nestedUpdates.push(
          prisma.emailPreferences.update({
            where: { id: user.userSettings.emailPrefs.id },
            data: data.emailPreferences
          })
        );
      } else {
        updateData.emailPrefs = {
          create: data.emailPreferences
        };
      }
    }
    
    // Update or create user settings
    const [settings] = await Promise.all([
      prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          ...updateData,
          notificationPrefs: updateData.notificationPrefs ? undefined : { create: {} },
          emailPrefs: updateData.emailPrefs ? undefined : { create: {} }
        },
        update: updateData,
        include: {
          notificationPrefs: true,
          emailPrefs: true,
        },
      }),
      ...nestedUpdates
    ]);
    
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

export default router;
