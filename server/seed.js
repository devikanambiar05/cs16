require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FAQ = require('./models/FAQ');
const parseFAQtxt = require('./parseFaqTxt');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samagama');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany({}), FAQ.deleteMany({})]);
    console.log('Cleared existing data');

    // Create a default admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@faqapp.com',
      password: 'admin123',
      role: 'admin',
      reputation: 100
    });
    console.log('Created admin user: admin@faqapp.com / admin123');

    // Parse FAQs from FAQ.txt
    const { sections, faqs } = parseFAQtxt();
    console.log(`Parsed ${faqs.length} FAQs from FAQ.txt across ${sections.length} sections`);

    // Insert FAQs
    const faqDocs = faqs.map(faq => ({
      title: faq.title,
      description: faq.description,
      finalAnswer: faq.finalAnswer,
      tags: faq.tags,
      status: 'resolved',
      createdBy: admin._id
    }));

    const inserted = await FAQ.insertMany(faqDocs);
    console.log(`Inserted ${inserted.length} FAQs into database`);

    // Summary by section
    console.log('\n=== FAQ Count by Section ===');
    sections.forEach(s => {
      const count = faqs.filter(f => f.sectionNumber === s.number).length;
      console.log(`  ${s.number}. ${s.title}: ${count} FAQs`);
    });

    console.log('\n✅ Seed completed successfully!');
    console.log(`\nTotal: ${inserted.length} FAQs`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();