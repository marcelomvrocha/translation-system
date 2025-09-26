const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSegments() {
  try {
    console.log('Checking segments in database...');
    
    // Get all segments
    const segments = await prisma.segment.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${segments.length} segments:`);
    segments.forEach((segment, index) => {
      console.log(`${index + 1}. Project: ${segment.project.name} (${segment.project.id})`);
      console.log(`   Segment Key: ${segment.segmentKey}`);
      console.log(`   Source Text: ${segment.sourceText}`);
      console.log(`   Target Text: ${segment.targetText || 'null'}`);
      console.log(`   Status: ${segment.status}`);
      console.log(`   Created: ${segment.createdAt}`);
      console.log('---');
    });

    // Check specific project
    const projectId = '94774b27-7447-46c2-b783-0e7fe3bc1a1b';
    const projectSegments = await prisma.segment.findMany({
      where: {
        projectId: projectId
      }
    });

    console.log(`\nSegments for project ${projectId}: ${projectSegments.length}`);
    projectSegments.forEach((segment, index) => {
      console.log(`${index + 1}. ${segment.segmentKey}: ${segment.sourceText}`);
    });

  } catch (error) {
    console.error('Error checking segments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSegments();
