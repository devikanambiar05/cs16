require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FAQ = require('./models/FAQ');
const Pin = require('./models/Pin');
const Query = require('./models/Query');
const Answer = require('./models/Answer');
const parseFAQtxt = require('./parseFaqTxt');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Granth');
    console.log('Connected to MongoDB');

    // Guard: require RESET_DB=true to proceed with destructive seed
    if (process.env.RESET_DB !== 'true') {
      let admin = await User.findOne({ email: 'admin@faqapp.com' });
      if (!admin) {
        admin = await User.create({
          name: 'Admin',
          email: 'admin@faqapp.com',
          password: 'admin123',
          role: 'admin',
          reputation: 1000,
          isVerified: true
        });
        console.log('Created admin user: admin@faqapp.com / admin123');
      } else {
        console.log('Admin user already exists, skipping seed (RESET_DB=true not set)');
      }
      console.log('\nTo reset and reseed the database, run: RESET_DB=true npm run seed');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('RESET_DB=true — clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      FAQ.deleteMany({}),
      Pin.deleteMany({}),
      Query.deleteMany({}),
      Answer.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create synthetic users
    console.log('Creating synthetic user profiles...');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@faqapp.com',
      password: 'admin123',
      role: 'admin',
      reputation: 1000,
      isVerified: true
    });

    const siddharth = await User.create({
      name: 'Siddharth Acharya',
      email: 'siddharth@example.com',
      password: 'password123',
      role: 'user',
      reputation: 750,
      isVerified: true,
      answersGiven: 14
    });

    const pooja = await User.create({
      name: 'Pooja Iyer',
      email: 'pooja@example.com',
      password: 'password123',
      role: 'user',
      reputation: 500,
      isVerified: true,
      answersGiven: 9
    });

    const vikram = await User.create({
      name: 'Vikram Rao',
      email: 'vikram@example.com',
      password: 'password123',
      role: 'user',
      reputation: 350,
      isVerified: true,
      answersGiven: 5
    });

    const ananya = await User.create({
      name: 'Ananya Sen',
      email: 'ananya@example.com',
      password: 'password123',
      role: 'user',
      reputation: 80,
      isVerified: true,
      answersGiven: 2
    });

    const rohan = await User.create({
      name: 'Rohan Mehta',
      email: 'rohan@example.com',
      password: 'password123',
      role: 'user',
      reputation: 25,
      isVerified: true,
      questionsAsked: 3
    });

    console.log('Synthetic users created successfully.');

    // Parse FAQs from FAQ.txt
    const { sections, faqs } = parseFAQtxt();
    console.log(`Parsed ${faqs.length} FAQs from FAQ.txt across ${sections.length} sections`);

    // Insert FAQs with trending viewCounts and lastViewed timestamps to test "This Week"
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const faqDocs = faqs.map((faq, index) => {
      // Pick some FAQs to be "popular in last 7 days"
      let lastViewed = null;
      let viewCount = Math.floor(Math.random() * 15); // standard low views
      
      // We make first few FAQs in primary categories highly trending
      const primaryTags = ['vibe-course', 'internship-rules', 'submission-guidelines'];
      const hasPrimaryTag = faq.tags.some(t => primaryTags.includes(t));

      if (hasPrimaryTag || index % 5 === 0) {
        viewCount = Math.floor(Math.random() * 100) + 50; // 50 to 150 views
        // Assign random last viewed timestamp within the last 5 days
        const days = [oneDayAgo, threeDaysAgo, fiveDaysAgo];
        lastViewed = days[index % days.length];
      }

      return {
        title: faq.title,
        description: faq.description,
        finalAnswer: faq.finalAnswer,
        tags: faq.tags,
        status: 'resolved',
        createdBy: admin._id,
        isValidated: true,
        viewCount,
        lastViewed,
        upvotes: Math.floor(Math.random() * 20)
      };
    });

    const inserted = await FAQ.insertMany(faqDocs);
    console.log(`Inserted ${inserted.length} FAQs into database`);

    // Insert default community board pins
    const announcementPin = await Pin.create({
      type: 'announcement',
      title: 'Granth 2026 Summership is Live!',
      content: 'Welcome all interns! Please make sure to check ViBe LMS daily for course announcements and progress score updates.',
      pinnedBy: admin._id,
      order: 0
    });

    const overviewPin = await Pin.create({
      type: 'overview',
      title: 'Overview',
      content: 'Granth is your student-driven community knowledge base. Search existing resolved FAQs first before raising new queries. Help peers by answering open queries in the forum!',
      pinnedBy: admin._id,
      order: 1
    });

    if (inserted.length > 0) {
      await Pin.create({
        type: 'faq',
        title: `Pinned FAQ: ${inserted[0].title}`,
        faqId: inserted[0]._id,
        pinnedBy: admin._id,
        order: 2
      });
    }
    console.log('Created default community board pins');

    // ── Seed active forum queries and responses ────────────────────────────
    console.log('Seeding community queries and responses...');

    // Query 1: Open Troubleshooting Query
    const query1 = await Query.create({
      title: 'How to fix the 100% progress issue in ViBe LMS?',
      description: 'I have completed all video modules and quizzes in the ViBe course, but my profile dashboard still shows 98% progress. Is there a specific lesson that needs manual marking?',
      tags: ['vibe-course', 'troubleshooting'],
      createdBy: rohan._id,
      status: 'open',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Query 2: Claimed Query
    const query2 = await Query.create({
      title: 'Is there a template we need to follow for the daily logs?',
      description: 'Can someone share the Markdown structure we need to use when writing our daily logs in our internship notebook? Do we include timestamps or just bullet points?',
      tags: ['internship-rules', 'logs'],
      createdBy: rohan._id,
      assignedTo: vikram._id,
      claimedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'claimed',
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000)
    });

    // Query 3: Closed Query with Accepted Answer
    const query3 = await Query.create({
      title: 'Where do we find the Git repo link for the final project submission?',
      description: 'Is the repository link shared on Slack, or is it on the ViBe LMS page? I need to fork it for my final project.',
      tags: ['submission-guidelines', 'git'],
      createdBy: ananya._id,
      status: 'closed',
      answeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolvedFAQ: inserted[0]._id,
      answerCount: 1
    });

    const answer3 = await Answer.create({
      content: "The final project repository is hosted on the organization's GitHub under `vicharanashala/cs16`. You don't need to fork it directly; instead, create a private repository following the instructions in the project description and add the reviewers as collaborators.",
      queryId: query3._id,
      userId: pooja._id,
      upvotes: 12,
      upvotedBy: [ananya._id, rohan._id, vikram._id],
      isAccepted: true,
      acceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isVetted: true,
      acceptedRepAwarded: 20
    });

    // Query 4: Open Query with competing answers
    const query4 = await Query.create({
      title: 'What happens if we miss the daily sync meeting due to college exams?',
      description: 'I have my final semester exam next Tuesday at 10 AM, which directly clashes with the daily sync. Who should I notify beforehand, and is there an alternative check-in?',
      tags: ['internship-rules', 'sync'],
      createdBy: ananya._id,
      status: 'open',
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      answerCount: 2
    });

    const answer4a = await Answer.create({
      content: "You must fill out the Absence Form in the Notion workspace at least 48 hours in advance and message your team lead on Slack. You will also need to review the recorded sync meeting later and update your daily log with a note explaining your absence.",
      queryId: query4._id,
      userId: siddharth._id,
      upvotes: 8,
      upvotedBy: [rohan._id, pooja._id],
      isAccepted: false,
      isVetted: true
    });

    const answer4b = await Answer.create({
      content: "Just tell your lead, they are usually very understanding about college exams!",
      queryId: query4._id,
      userId: vikram._id,
      upvotes: 2,
      upvotedBy: [rohan._id],
      isAccepted: false,
      isVetted: false
    });

    console.log('Seeded community Q&A successfully!');

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