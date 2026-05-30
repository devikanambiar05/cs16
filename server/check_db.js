const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db('Granth');
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name).join(', '));
  
  const faqsCount = await db.collection('faqs').countDocuments({});
  console.log('faqs count (all):', faqsCount);
  
  const resolvedCount = await db.collection('faqs').countDocuments({ status: 'resolved', deletedAt: null });
  console.log('faqs count (resolved, not deleted):', resolvedCount);
  
  const queriesCount = await db.collection('queries').countDocuments({});
  console.log('queries count:', queriesCount);
  
  await client.close();
}

main().catch(console.error);
