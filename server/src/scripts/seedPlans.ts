import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'starter',
    displayName: 'Starter',
    price: 9900, // $99 in cents
    currency: 'usd',
    interval: 'month',
    features: {
      connections: 1,
      queries: 100,
      charts: 'basic',
      support: 'email',
      community: true,
      visualizations: false,
      teamCollaboration: false,
      apiAccess: false
    },
    limits: {
      maxConnections: 1,
      maxQueries: 100,
      maxTeamMembers: 1
    }
  },
  {
    name: 'growth',
    displayName: 'Growth',
    price: 17900, // $179 in cents
    currency: 'usd',
    interval: 'month',
    features: {
      connections: 5,
      queries: 1000,
      charts: 'advanced',
      teamMembers: 7,
      customVisualizations: true,
      apiAccess: true,
      support: 'email',
      phoneSupport: false,
      onPremise: false
    },
    limits: {
      maxConnections: 5,
      maxQueries: 1000,
      maxTeamMembers: 7
    }
  },
  {
    name: 'team',
    displayName: 'Team',
    price: 56900, // $569 in cents
    currency: 'usd',
    interval: 'month',
    features: {
      connections: 10,
      queries: 10000,
      charts: 'advanced',
      teamMembers: 20,
      customVisualizations: true,
      apiAccess: true,
      phoneSupport: true,
      customIntegrations: true,
      onPremise: false
    },
    limits: {
      maxConnections: 10,
      maxQueries: 10000,
      maxTeamMembers: 20
    }
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 0, // Custom pricing
    currency: 'usd',
    interval: 'month',
    features: {
      connections: 'unlimited',
      queries: 'unlimited',
      onPremise: true,
      dedicatedSupport: true,
      customTraining: true,
      slaGuarantees: true,
      advancedSecurity: true,
      customDevelopment: true
    },
    limits: {
      maxConnections: -1, // -1 represents unlimited
      maxQueries: -1,
      maxTeamMembers: -1
    }
  }
];

async function seedPlans() {
  console.log('Seeding billing plans...');

  for (const planData of plans) {
    try {
      const plan = await prisma.plan.upsert({
        where: { name: planData.name },
        update: {
          displayName: planData.displayName,
          price: planData.price,
          currency: planData.currency,
          interval: planData.interval,
          features: planData.features,
          limits: planData.limits,
          active: true
        },
        create: {
          name: planData.name,
          displayName: planData.displayName,
          price: planData.price,
          currency: planData.currency,
          interval: planData.interval,
          features: planData.features,
          limits: planData.limits,
          active: true
        }
      });

      console.log(`✓ Plan "${plan.displayName}" seeded successfully`);
    } catch (error) {
      console.error(`✗ Error seeding plan "${planData.displayName}":`, error);
    }
  }

  console.log('Billing plans seeding completed!');
}

async function main() {
  try {
    await seedPlans();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
main();

export { seedPlans };
