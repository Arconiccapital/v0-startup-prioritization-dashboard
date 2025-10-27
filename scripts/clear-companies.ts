import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllCompanies() {
  try {
    console.log('🗑️  Clearing all companies from database...')

    // Delete all threshold issues first (foreign key constraint)
    const deletedIssues = await prisma.thresholdIssue.deleteMany({})
    console.log(`   Deleted ${deletedIssues.count} threshold issues`)

    // Delete all startups
    const deletedStartups = await prisma.startup.deleteMany({})
    console.log(`   Deleted ${deletedStartups.count} startups`)

    console.log('✅ Database cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllCompanies()
