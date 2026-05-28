require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FAQ = require('./models/FAQ');
const Query = require('./models/Query');
const Answer = require('./models/Answer');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samagama');
    console.log('Connected to MongoDB');

    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      FAQ.deleteMany({}),
      Query.deleteMany({}),
      Answer.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = await User.insertMany([
      { name: 'Priya Sharma', email: 'priya@university.edu', password: 'password123', role: 'admin', reputation: 150 },
      { name: 'Rahul Verma', email: 'rahul@university.edu', password: 'password123', reputation: 85 },
      { name: 'Sneha Patel', email: 'sneha@university.edu', password: 'password123', reputation: 62 },
      { name: 'Amit Singh', email: 'amit@university.edu', password: 'password123', reputation: 45 },
    ]);
    console.log(`Created ${users.length} users`);

    // Create FAQs
    const faqs = await FAQ.insertMany([
      {
        title: 'How do I reset my student portal password?',
        description: 'I forgot my password and cannot access the student portal. What is the reset process?',
        finalAnswer: 'Go to the student portal login page and click "Forgot Password". Enter your registered email and student ID. You will receive a reset link within 10 minutes. If you don\'t receive it, check your spam folder or visit the IT helpdesk in the Admin Block, Room 101.',
        tags: ['portal', 'password', 'login', 'it'],
        upvotes: 47,
        createdBy: users[0]._id
      },
      {
        title: 'What is the last date to pay semester fees?',
        description: 'I need to know the deadline for fee payment to avoid late charges.',
        finalAnswer: 'The last date to pay semester fees without penalty is typically 2 weeks before classes start. For the current semester, the deadline is August 15th. A late fee of Rs. 500 per week applies after the deadline. You can pay online via the student portal or at the accounts office.',
        tags: ['fees', 'payment', 'deadline'],
        upvotes: 89,
        createdBy: users[0]._id
      },
      {
        title: 'How do I apply for a duplicate ID card?',
        description: 'I lost my student ID card and need to apply for a replacement.',
        finalAnswer: 'Visit the Students\' Affairs office with a police FIR (if lost/stolen) or a written application (if damaged). Fill out the ID card replacement form and pay Rs. 200 at the accounts counter. The new card will be issued within 3-5 working days.',
        tags: ['id-card', ' replacement', 'students-affairs'],
        upvotes: 34,
        createdBy: users[1]._id
      },
      {
        title: 'Where can I find past exam papers?',
        description: 'I want to prepare using previous year question papers. Where are they stored?',
        finalAnswer: 'Past exam papers are available in the library\'s digital repository. Log in with your student credentials at library.university.edu, go to "Examinations" section. Printed copies are available in the reference section of the library, 3rd floor.',
        tags: ['exams', 'papers', 'library', 'resources'],
        upvotes: 112,
        createdBy: users[2]._id
      },
      {
        title: 'How do I register for a new elective course?',
        description: 'The course registration window is open but I cannot find the option to add electives.',
        finalAnswer: 'Log in to the student portal, go to "Academics" > "Course Registration". Electives are listed in Step 2 of the registration process. If you don\'t see your preferred elective, it may be full or not offered this semester. Contact your academic advisor for permission codes for closed electives.',
        tags: ['courses', 'registration', 'elective', 'academics'],
        upvotes: 56,
        createdBy: users[1]._id
      },
      {
        title: 'Is there a bus service for students?',
        description: 'I stay off-campus and need information about the college bus service.',
        finalAnswer: 'Yes, the college operates bus routes covering major areas of the city. Bus passes can be purchased from the Transport Office (Block C, Ground Floor). Monthly pass costs Rs. 1,500. Routes and timings are available on the college website under "Transport Services".',
        tags: ['bus', 'transport', 'commute'],
        upvotes: 78,
        createdBy: users[0]._id
      },
    ]);
    console.log(`Created ${faqs.length} FAQs`);

    // Create queries (unresolved questions)
    const queries = await Query.insertMany([
      {
        title: 'Can I appear for exams if my attendance is below 75%?',
        description: 'My attendance this semester is around 68% due to medical issues. Will I be allowed to write the end-semester exam? Is there any provision for condonation?',
        tags: ['attendance', 'exams', 'condonation'],
        status: 'answered',
        createdBy: users[3]._id,
        answerCount: 2
      },
      {
        title: 'How do I get my transcripts for abroad applications?',
        description: 'I need official transcripts for my graduate school applications. What is the process and how long does it take?',
        tags: ['transcripts', 'abroad', 'applications'],
        status: 'open',
        createdBy: users[2]._id
      },
      {
        title: 'Where can I get free software for my laptop?',
        description: 'I need Microsoft Office and some programming tools for my coursework. Does the college provide free software for students?',
        tags: ['software', 'tools', 'laptop'],
        status: 'answered',
        createdBy: users[3]._id,
        answerCount: 1
      },
    ]);
    console.log(`Created ${queries.length} queries`);

    // Create answers
    const answers = await Answer.insertMany([
      {
        content: 'The minimum attendance requirement is 75% to appear for end-semester exams. However, if you have medical reasons, you can apply for attendance condonation. Submit a medical certificate from a registered doctor to the Dean\'s office within 7 days of joining back. Each case is reviewed individually. In some cases, up to 10% condonation is granted for genuine medical reasons.',
        queryId: queries[0]._id,
        userId: users[0]._id,
        upvotes: 15,
        isAccepted: true
      },
      {
        content: 'You can also appeal to your class teacher if you have genuine reasons. Some professors allow students with 70-75% attendance if they have good internal marks. But this is at the professor\'s discretion. Best to talk to your Dean directly.',
        queryId: queries[0]._id,
        userId: users[1]._id,
        upvotes: 8
      },
      {
        content: 'Yes! The college provides Microsoft Office 365 free for all students via the Microsoft Azure for Students program. Log in with your college email at portal.office.com. For programming tools, check the IT department\'s software center in the Computer Science block - they have free licenses for VS Code, IntelliJ, and other tools.',
        queryId: queries[2]._id,
        userId: users[1]._id,
        upvotes: 22,
        isAccepted: true
      },
    ]);
    console.log(`Created ${answers.length} answers`);

    console.log('\nSeed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: priya@university.edu / password123');
    console.log('User:  rahul@university.edu / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();