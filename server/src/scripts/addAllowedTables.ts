import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAllowedTables() {
  console.log('Adding allowed tables for development tenant...');

  const commonTables = [
    'users',
    'teams', 
    'projects',
    'orders',
    'customers',
    'products',
    'employees',
    'departments',
    'sales',
    'inventory',
    'accounts',
    'transactions',
    'invoices',
    'payments'
  ];

  try {
    const tenantId = 'dev-tenant-1';

    // Check existing allowed tables
    const existing = await prisma.allowedTable.findMany({
      where: { tenantId }
    });

    const existingNames = existing.map(t => t.name);
    const newTables = commonTables.filter(name => !existingNames.includes(name));

    if (newTables.length === 0) {
      console.log('✓ All common tables already allowed');
      return;
    }

    // Add new allowed tables
    const created = await prisma.$transaction(
      newTables.map(name =>
        prisma.allowedTable.create({
          data: {
            tenantId,
            name,
            allowedCols: '[]' // Empty array means all columns allowed
          }
        })
      )
    );

    console.log(`✓ Added ${created.length} new allowed tables:`);
    newTables.forEach(name => console.log(`  - ${name}`));

    console.log('\nAll allowed tables for tenant:');
    const allTables = await prisma.allowedTable.findMany({
      where: { tenantId },
      select: { name: true }
    });
    allTables.forEach(table => console.log(`  - ${table.name}`));

  } catch (error) {
    console.error('Error adding allowed tables:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAllowedTables();
