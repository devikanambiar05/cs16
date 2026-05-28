const FAQ = require('../models/FAQ');

// Regex to detect numeric question-ID tags like "13.15", "12.1", etc.
// These are second-element tags and should not become categories
const NUMERIC_TAG_RE = /^\d+\.\d+$/;

// Categories with this many or fewer FAQs get grouped into MISC
const MISC_THRESHOLD = 2;

// Get all categories derived from FAQ sectionTitles
exports.getCategories = async (req, res) => {
  try {
    // Only use the FIRST tag (the section/category tag), not all tags.
    // This avoids numeric question IDs like "13.15" from appearing as categories.
    const categories = await FAQ.aggregate([
      { $match: { status: 'resolved' } },
      // Project only the first tag (index 0) — the section category tag
      { $project: { firstTag: { $arrayElemAt: ['$tags', 0] }, title: 1 } },
      // Filter out any firstTag that matches the numeric question-ID pattern
      { $match: { firstTag: { $not: NUMERIC_TAG_RE } } },
      {
        $group: {
          _id: '$firstTag',
          count: { $sum: 1 },
          sampleFAQ: { $first: '$title' }
        }
      },
      { $sort: { count: -1, _id: 1 } }
    ]);

    // Separate main categories from rare ones (≤2 FAQs) to group under MISC
    const mainCategories = [];
    let miscCount = 0;
    let miscSample = null;

    for (const c of categories) {
      if (c.count <= MISC_THRESHOLD) {
        miscCount += c.count;
        miscSample = miscSample || c.sampleFAQ;
      } else {
        mainCategories.push({
          id: c._id,
          name: formatCategoryName(c._id),
          tag: c._id,
          count: c.count
        });
      }
    }

    // Build final list: main categories first, then MISC if applicable
    const categoryList = mainCategories;

    if (miscCount > 0) {
      categoryList.push({
        id: 'misc',
        name: 'MISC',
        tag: 'misc',
        count: miscCount,
        sampleFAQ: miscSample
      });
    }

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
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query;
    if (tag === 'misc') {
      // MISC: collect FAQs from categories with ≤2 items each
      const allCategories = await FAQ.aggregate([
        { $match: { status: 'resolved' } },
        { $project: { firstTag: { $arrayElemAt: ['$tags', 0] }, title: 1, tags: 1 } },
        { $match: { firstTag: { $not: NUMERIC_TAG_RE } } },
        {
          $group: {
            _id: '$firstTag',
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $lte: MISC_THRESHOLD } } }
      ]);
      const miscTags = allCategories.map(c => c._id);
      query = { status: 'resolved', tags: { $in: miscTags } };
    } else {
      query = { status: 'resolved', tags: tag };
    }

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