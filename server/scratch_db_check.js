const mongoose = require('mongoose');
require('dotenv').config();
const FAQ = require('./models/FAQ');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Grantha');
  console.log('Connected to MongoDB');

  const faq = await FAQ.findOne({ tags: '3.8' });
  if (faq) {
    console.log('FAQ Title:', faq.title);
    console.log('FAQ tags:', faq.tags);
    console.log('FAQ finalAnswer length:', faq.finalAnswer.length);
    console.log('FAQ finalAnswer:');
    console.log(faq.finalAnswer);
  } else {
    console.log('FAQ 3.8 not found in DB!');
  }

  await mongoose.disconnect();
}

check().catch(console.error);
