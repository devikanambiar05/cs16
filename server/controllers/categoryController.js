const FAQ = require('../models/FAQ');

// Get all categories derived from FAQ sectionTitles
exports.getCategories = async (req, res) => {
  try {
    // Aggregate FAQs by their sectionTitle (stored as a tag) to get categories
    // We derive categories from the first tag of each FAQ (which is the section tag)
    const categories = await FAQ.aggregate([
      { $match: { status: 'resolved' } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          // Get a sample FAQ to get the title for display
          sampleFAQ: { $first: '$title' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map to a cleaner format
    const categoryList = categories.map((c, i) => ({
      id: c._id,
      name: formatCategoryName(c._id),
      tag: c._id,
      count: c.count
    }));

    res.json(categoryList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get FAQs by category tag
exports.getFAQsByCategory = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { status: 'resolved', tags: tag };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [faqs, total] = await Promise.all([
      FAQ.find(query)
        .populate('createdBy', 'name')
        .sort({ upvotes: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FAQ.countDocuments(query)
    ]);

    res.json({
      faqs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

function formatCategoryName(tag) {
  // Convert "about-the-internship" to "About The Internship"
  return tag
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}