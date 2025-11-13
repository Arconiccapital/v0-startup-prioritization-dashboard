const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAll() {
  try {
    console.log('🗑️  Deleting all startups...');

    // Delete all threshold issues first (foreign key constraint)
    const deletedIssues = await prisma.thresholdIssue.deleteMany({});
    console.log(`✓ Deleted ${deletedIssues.count} threshold issues`);

    // Delete all startups
    const deletedStartups = await prisma.startup.deleteMany({});
    console.log(`✓ Deleted ${deletedStartups.count} startups`);

    console.log('\n✅ All startups deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAll();
