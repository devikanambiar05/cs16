const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  await client.connect();
  const samDb = client.db('Grantha');
  const faqsCount = await samDb.collection('faqs').countDocuments({});
  console.log('Grantha.faqs count:', faqsCount);
  const resolvedCount = await samDb.collection('faqs').countDocuments({ status: 'resolved' });
  console.log('Grantha.faqs resolved count:', resolvedCount);
  
  const dbs = await client.db().admin().listDatabases();
  dbs.databases.forEach(db => {
    if (db.name !== 'admin' && db.name !== 'config' && db.name !== 'local') {
      const targetDb = client.db(db.name);
      const counts = [];
      try {
        const colls = await targetDb.listCollections().toArray();
        for (const c of colls) {
          if (c.name === 'faqs' || c.name === 'queries') {
            const cnt = await targetDb.collection(c.name).countDocuments({}).catch(() => -1);
            counts.push(c.name + ':' + cnt);
          }
        }
      } catch(e) {}
      if (counts.length > 0) console.log(db.name + ':', counts.join(','));
    }
  });
  
  await client.close();
}
main().catch(console.error);