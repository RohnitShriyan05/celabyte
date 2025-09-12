"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedUser() {
    console.log('Seeding development user and tenant...');
    try {
        // Create or find the development tenant
        let tenant = await prisma.tenant.findUnique({
            where: { slug: 'dev-tenant-1' }
        });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    id: 'dev-tenant-1',
                    name: 'Development Tenant',
                    slug: 'dev-tenant-1'
                }
            });
            console.log('✓ Development tenant created');
        }
        else {
            console.log('✓ Development tenant already exists');
        }
        // Create or find the development user
        let user = await prisma.user.findUnique({
            where: { email: 'dev@example.com' }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: 'dev-user-1',
                    email: 'dev@example.com',
                    passwordHash: 'dev-password-hash' // Development only
                }
            });
            console.log('✓ Development user created');
        }
        else {
            console.log('✓ Development user already exists');
        }
        // Create or find the user-tenant membership
        let membership = await prisma.userTenant.findFirst({
            where: {
                userId: user.id,
                tenantId: tenant.id
            }
        });
        if (!membership) {
            membership = await prisma.userTenant.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    role: 'ADMIN'
                }
            });
            console.log('✓ User-tenant membership created with ADMIN role');
        }
        else {
            console.log('✓ User-tenant membership already exists');
        }
        console.log('\nDevelopment setup complete!');
        console.log(`User ID: ${user.id}`);
        console.log(`Tenant ID: ${tenant.id}`);
        console.log(`Role: ${membership.role}`);
    }
    catch (error) {
        console.error('Error seeding user:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
seedUser();
