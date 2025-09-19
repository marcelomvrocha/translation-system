import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      avatarUrl: 'https://via.placeholder.com/150/000000/FFFFFF?text=A',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'translator@example.com' },
    update: {},
    create: {
      email: 'translator@example.com',
      password: hashedPassword,
      name: 'Translator User',
      avatarUrl: 'https://via.placeholder.com/150/0066CC/FFFFFF?text=T',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      password: hashedPassword,
      name: 'Reviewer User',
      avatarUrl: 'https://via.placeholder.com/150/CC6600/FFFFFF?text=R',
    },
  });

  console.log('👤 Created users:', { user1: user1.email, user2: user2.email, user3: user3.email });

  // Create test projects
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      name: 'Website Translation Project',
      description: 'Translating company website from English to Spanish',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      ownerId: user1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      name: 'Mobile App Localization',
      description: 'Localizing mobile application for French market',
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      ownerId: user1.id,
    },
  });

  console.log('📁 Created projects:', { project1: project1.name, project2: project2.name });

  // Add collaborators to projects
  await prisma.projectCollaborator.upsert({
    where: { 
      projectId_userId: {
        projectId: project1.id,
        userId: user2.id
      }
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: user2.id,
      role: 'translator',
    },
  });

  await prisma.projectCollaborator.upsert({
    where: { 
      projectId_userId: {
        projectId: project1.id,
        userId: user3.id
      }
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: user3.id,
      role: 'reviewer',
    },
  });

  // Add owner as collaborator
  await prisma.projectCollaborator.upsert({
    where: { 
      projectId_userId: {
        projectId: project1.id,
        userId: user1.id
      }
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: user1.id,
      role: 'owner',
    },
  });

  await prisma.projectCollaborator.upsert({
    where: { 
      projectId_userId: {
        projectId: project2.id,
        userId: user1.id
      }
    },
    update: {},
    create: {
      projectId: project2.id,
      userId: user1.id,
      role: 'owner',
    },
  });

  console.log('👥 Added collaborators to projects');

  // Create sample segments
  const segments = [
    {
      projectId: project1.id,
      segmentKey: 'welcome.title',
      sourceText: 'Welcome to our website',
      targetText: 'Bienvenido a nuestro sitio web',
      status: 'translated',
      translatorId: user2.id,
      reviewerId: user3.id,
    },
    {
      projectId: project1.id,
      segmentKey: 'welcome.subtitle',
      sourceText: 'We are glad to have you here',
      targetText: 'Nos alegra tenerte aquí',
      status: 'reviewed',
      translatorId: user2.id,
      reviewerId: user3.id,
    },
    {
      projectId: project1.id,
      segmentKey: 'navigation.home',
      sourceText: 'Home',
      targetText: 'Inicio',
      status: 'approved',
      translatorId: user2.id,
      reviewerId: user3.id,
    },
    {
      projectId: project1.id,
      segmentKey: 'navigation.about',
      sourceText: 'About Us',
      targetText: 'Acerca de Nosotros',
      status: 'in_progress',
      translatorId: user2.id,
    },
    {
      projectId: project1.id,
      segmentKey: 'navigation.contact',
      sourceText: 'Contact',
      targetText: '',
      status: 'new',
    },
  ];

  for (const segment of segments) {
    await prisma.segment.upsert({
      where: {
        projectId_segmentKey: {
          projectId: segment.projectId,
          segmentKey: segment.segmentKey,
        }
      },
      update: {},
      create: segment,
    });
  }

  console.log('📝 Created sample segments');

  // Create sample translation memory
  const translationMemory = [
    {
      projectId: project1.id,
      sourceText: 'Welcome to our website',
      targetText: 'Bienvenido a nuestro sitio web',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      matchPercentage: 100,
    },
    {
      projectId: project1.id,
      sourceText: 'We are glad to have you here',
      targetText: 'Nos alegra tenerte aquí',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      matchPercentage: 100,
    },
    {
      projectId: project1.id,
      sourceText: 'Home',
      targetText: 'Inicio',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      matchPercentage: 100,
    },
  ];

  for (const tm of translationMemory) {
    await prisma.translationMemory.upsert({
      where: {
        projectId_sourceText_sourceLanguage_targetLanguage: {
          projectId: tm.projectId,
          sourceText: tm.sourceText,
          sourceLanguage: tm.sourceLanguage,
          targetLanguage: tm.targetLanguage,
        }
      },
      update: {},
      create: tm,
    });
  }

  console.log('💾 Created sample translation memory');

  // Create sample glossaries
  const glossaries = [
    {
      projectId: project1.id,
      term: 'website',
      definition: 'A collection of web pages',
      translation: 'sitio web',
      category: 'technical',
    },
    {
      projectId: project1.id,
      term: 'user',
      definition: 'A person who uses the website',
      translation: 'usuario',
      category: 'general',
    },
    {
      projectId: project1.id,
      term: 'navigation',
      definition: 'The process of moving around a website',
      translation: 'navegación',
      category: 'ui',
    },
  ];

  for (const glossary of glossaries) {
    await prisma.glossary.upsert({
      where: {
        projectId_term: {
          projectId: glossary.projectId,
          term: glossary.term,
        }
      },
      update: {},
      create: glossary,
    });
  }

  console.log('📚 Created sample glossaries');

  console.log('✅ Database seed completed successfully!');
  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@example.com / password123');
  console.log('Translator: translator@example.com / password123');
  console.log('Reviewer: reviewer@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
