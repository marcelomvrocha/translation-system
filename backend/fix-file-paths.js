const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function fixFilePaths() {
  try {
    console.log('Fixing file paths in database...');
    
    // Get all attachments
    const attachments = await prisma.attachment.findMany();
    
    for (const attachment of attachments) {
      // Convert relative path to absolute path
      const absolutePath = path.resolve(attachment.filePath);
      
      console.log(`Updating ${attachment.originalFilename}: ${attachment.filePath} -> ${absolutePath}`);
      
      // Update the file path
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { filePath: absolutePath }
      });
    }
    
    console.log('File paths updated successfully!');
  } catch (error) {
    console.error('Error fixing file paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFilePaths();
