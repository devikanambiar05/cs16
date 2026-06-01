const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  await client.connect();
  
  const dbs = await client.db().admin().listDatabases();
  console.log('All databases:');
  dbs.databases.forEach(db => console.log(' -', db.name, 'size:', db.sizeOnDisk));
  
  // Check Grantha
  const samDb = client.db('Grantha');
  const faqsCount = await samDb.collection('faqs').countDocuments({});
  console.log('\nGrantha.faqs count:', faqsCount);
  
  // Check researchPapers 
  const rpDb = client.db('researchPapers');
  const rpFaqs = await rpDb.collection('faqs').countDocuments({}).catch(() => 'collection not found');
  console.log('researchPapers.faqs count:', rpFaqs);
  
  // Check research_papers_db
  const rpdDb = client.db('research_papers_db');
  const rpdFaqs = await rpdDb.collection('faqs').countDocuments({}).catch(() => 'collection not found');
  console.log('research_papers_db.faqs count:', rpdFaqs);
  
  await client.close();
}
main().catch(console.error);