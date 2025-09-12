"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const jwt_1 = require("../auth/jwt");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all plans
router.get('/plans', jwt_1.authMiddleware, async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: 'asc' }
        });
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});
// Get current subscription
router.get('/subscription', jwt_1.authMiddleware, async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: req.user.tenantId },
            include: { plan: true }
        });
        res.json(subscription);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});
// Get usage data
router.get('/usage', jwt_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const usage = await prisma.usageRecord.groupBy({
            by: ['metric'],
            where: {
                tenantId: req.user.tenantId,
                timestamp: { gte: startOfMonth }
            },
            _sum: { quantity: true }
        });
        const usageMap = usage.reduce((acc, record) => {
            acc[record.metric.toLowerCase()] = record._sum.quantity || 0;
            return acc;
        }, {});
        res.json(usageMap);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});
// Create or update subscription
const subscriptionSchema = zod_1.z.object({
    planId: zod_1.z.string(),
    paymentMethodId: zod_1.z.string().optional()
});
router.post("/subscription", jwt_1.authMiddleware, async (req, res) => {
    try {
        const { planId, paymentMethodId } = subscriptionSchema.parse(req.body);
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        const existingSubscription = await prisma.subscription.findFirst({
            where: { tenantId: req.user.tenantId }
        });
        if (existingSubscription) {
            // Update existing subscription
            const subscription = await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                    planId,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    cancelAtPeriodEnd: false
                },
                include: { plan: true }
            });
            res.json(subscription);
        }
        else {
            // Create new subscription
            const subscription = await prisma.subscription.create({
                data: {
                    tenantId: req.user.tenantId,
                    planId,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    cancelAtPeriodEnd: false
                },
                include: { plan: true }
            });
            res.json(subscription);
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create/update subscription' });
    }
});
// Cancel subscription
router.post("/subscription/cancel", jwt_1.authMiddleware, async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: req.user.tenantId }
        });
        if (!subscription) {
            return res.status(404).json({ error: "No active subscription found" });
        }
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { cancelAtPeriodEnd: true },
            include: { plan: true }
        });
        res.json(updatedSubscription);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});
// Record usage
const usageSchema = zod_1.z.object({
    metric: zod_1.z.enum(['QUERIES', 'CONNECTIONS', 'TEAM_MEMBERS', 'API_CALLS']),
    quantity: zod_1.z.number().min(1),
    metadata: zod_1.z.object({}).optional()
});
router.post("/usage", jwt_1.authMiddleware, async (req, res) => {
    try {
        const { metric, quantity, metadata } = usageSchema.parse(req.body);
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: req.user.tenantId }
        });
        if (!subscription) {
            return res.status(404).json({ error: "No active subscription found" });
        }
        const usageRecord = await prisma.usageRecord.create({
            data: {
                subscriptionId: subscription.id,
                tenantId: req.user.tenantId,
                metric: metric,
                quantity: quantity,
                metadata: metadata || {}
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record usage' });
    }
});
// Get usage for current period
router.get("/usage", async (req, res, next) => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: req.user.tenantId },
            include: { plan: true }
        });
        if (!subscription) {
            return res.json({ usage: {}, limits: {}, subscription: null });
        }
        // Get usage for current billing period
        const usage = await prisma.usageRecord.findMany({
            where: {
                tenantId: req.user.tenantId,
                timestamp: {
                    gte: subscription.currentPeriodStart,
                    lte: subscription.currentPeriodEnd
                }
            }
        });
        // Aggregate usage by metric
        const usageSummary = usage.reduce((acc, record) => {
            const metric = record.metric.toLowerCase();
            acc[metric] = (acc[metric] || 0) + record.quantity;
            return acc;
        }, {});
        // Get plan limits
        const limits = subscription.plan.limits;
        res.json({
            usage: usageSummary,
            limits: limits,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                plan: subscription.plan,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd
            }
        });
    }
    catch (e) {
        next(e);
    }
});
// Get invoices
router.get("/invoices", async (req, res, next) => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: req.user.tenantId }
        });
        if (!subscription) {
            return res.json([]);
        }
        const invoices = await prisma.invoice.findMany({
            where: { subscriptionId: subscription.id },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    }
    catch (e) {
        next(e);
    }
});
// Check usage limits
router.get("/limits/check", async (req, res, next) => {
    try {
        const { metric } = req.query;
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: req.user.tenantId },
            include: { plan: true }
        });
        if (!subscription) {
            return res.json({ allowed: false, reason: "No active subscription" });
        }
        const limits = subscription.plan.limits;
        // Get current usage for the metric
        const currentUsage = await prisma.usageRecord.aggregate({
            where: {
                tenantId: req.user.tenantId,
                metric: metric,
                timestamp: {
                    gte: subscription.currentPeriodStart,
                    lte: subscription.currentPeriodEnd
                }
            },
            _sum: { quantity: true }
        });
        const usedAmount = currentUsage._sum.quantity || 0;
        const metricKey = `max${metric?.toString().charAt(0).toUpperCase()}${metric?.toString().slice(1).toLowerCase()}`;
        const limit = limits[metricKey];
        // -1 means unlimited
        if (limit === -1) {
            return res.json({ allowed: true, used: usedAmount, limit: -1 });
        }
        const allowed = usedAmount < limit;
        res.json({
            allowed,
            used: usedAmount,
            limit: limit,
            remaining: limit - usedAmount,
            reason: allowed ? null : `${metric} limit exceeded`
        });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
