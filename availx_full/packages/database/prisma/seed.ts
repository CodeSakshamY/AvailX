import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const homeServices = await prisma.category.upsert({
    where: { slug: 'home-services' },
    update: {},
    create: {
      name: 'Home Services',
      slug: 'home-services',
      nameTranslations: {
        en: 'Home Services',
        hi: 'घरेलू सेवाएं',
        ur: 'گھریلو خدمات',
      },
      icon: '🏠',
      description: 'Essential home maintenance and repair services',
      isActive: true,
      sortOrder: 1,
    },
  });

  const personalCare = await prisma.category.upsert({
    where: { slug: 'personal-care' },
    update: {},
    create: {
      name: 'Personal Care',
      slug: 'personal-care',
      nameTranslations: {
        en: 'Personal Care',
        hi: 'व्यक्तिगत देखभाल',
        ur: 'ذاتی نگہداشت',
      },
      icon: '💆',
      description: 'Beauty, fitness, and wellness services',
      isActive: true,
      sortOrder: 2,
    },
  });

  const education = await prisma.category.upsert({
    where: { slug: 'education' },
    update: {},
    create: {
      name: 'Education',
      slug: 'education',
      nameTranslations: {
        en: 'Education',
        hi: 'शिक्षा',
        ur: 'تعلیم',
      },
      icon: '📚',
      description: 'Tutoring and skill development services',
      isActive: true,
      sortOrder: 3,
    },
  });

  // Create subcategories for Home Services
  await prisma.subCategory.createMany({
    data: [
      {
        categoryId: homeServices.id,
        name: 'Plumbing',
        slug: 'plumbing',
        nameTranslations: {
          en: 'Plumbing',
          hi: 'प्लंबिंग',
          ur: 'پلمبنگ',
        },
        description: 'Pipe repair, installation, and maintenance',
        isActive: true,
        sortOrder: 1,
      },
      {
        categoryId: homeServices.id,
        name: 'Electrical',
        slug: 'electrical',
        nameTranslations: {
          en: 'Electrical',
          hi: 'बिजली',
          ur: 'بجلی',
        },
        description: 'Electrical wiring, repair, and installation',
        isActive: true,
        sortOrder: 2,
      },
      {
        categoryId: homeServices.id,
        name: 'Carpentry',
        slug: 'carpentry',
        nameTranslations: {
          en: 'Carpentry',
          hi: 'बढ़ईगीरी',
          ur: 'بڑھئی',
        },
        description: 'Furniture repair and woodwork',
        isActive: true,
        sortOrder: 3,
      },
      {
        categoryId: homeServices.id,
        name: 'Cleaning',
        slug: 'cleaning',
        nameTranslations: {
          en: 'Cleaning',
          hi: 'सफाई',
          ur: 'صفائی',
        },
        description: 'Home and office cleaning services',
        isActive: true,
        sortOrder: 4,
      },
    ],
    skipDuplicates: true,
  });

  // Create subcategories for Personal Care
  await prisma.subCategory.createMany({
    data: [
      {
        categoryId: personalCare.id,
        name: 'Salon & Spa',
        slug: 'salon-spa',
        nameTranslations: {
          en: 'Salon & Spa',
          hi: 'सैलून और स्पा',
          ur: 'سیلون اور سپا',
        },
        description: 'Hair, beauty, and spa services',
        isActive: true,
        sortOrder: 1,
      },
      {
        categoryId: personalCare.id,
        name: 'Fitness Trainer',
        slug: 'fitness-trainer',
        nameTranslations: {
          en: 'Fitness Trainer',
          hi: 'फिटनेस ट्रेनर',
          ur: 'فٹنس ٹرینر',
        },
        description: 'Personal training and fitness coaching',
        isActive: true,
        sortOrder: 2,
      },
      {
        categoryId: personalCare.id,
        name: 'Yoga Instructor',
        slug: 'yoga-instructor',
        nameTranslations: {
          en: 'Yoga Instructor',
          hi: 'योग प्रशिक्षक',
          ur: 'یوگا انسٹرکٹر',
        },
        description: 'Yoga classes and meditation',
        isActive: true,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });

  // Create subcategories for Education
  await prisma.subCategory.createMany({
    data: [
      {
        categoryId: education.id,
        name: 'Home Tutor',
        slug: 'home-tutor',
        nameTranslations: {
          en: 'Home Tutor',
          hi: 'गृह शिक्षक',
          ur: 'ہوم ٹیوٹر',
        },
        description: 'Subject tutoring for students',
        isActive: true,
        sortOrder: 1,
      },
      {
        categoryId: education.id,
        name: 'Music Teacher',
        slug: 'music-teacher',
        nameTranslations: {
          en: 'Music Teacher',
          hi: 'संगीत शिक्षक',
          ur: 'موسیقی کے استاد',
        },
        description: 'Instrument and vocal training',
        isActive: true,
        sortOrder: 2,
      },
      {
        categoryId: education.id,
        name: 'Language Teacher',
        slug: 'language-teacher',
        nameTranslations: {
          en: 'Language Teacher',
          hi: 'भाषा शिक्षक',
          ur: 'زبان کے استاد',
        },
        description: 'Language learning and coaching',
        isActive: true,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
