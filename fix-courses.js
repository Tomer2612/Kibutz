const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.course.updateMany({
    data: { isPublished: true }
  });
  console.log('Updated', result.count, 'courses to published');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
