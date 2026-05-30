const ChatSession = require('../models/ChatSession');

// Get all chat sessions of the logged-in user
exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('title updatedAt createdAt')
      .sort({ updatedAt: -1 });
    res.json(sessions || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
};

// Create a new session or update an existing session with messages
exports.saveSession = async (req, res) => {
  try {
    const { sessionId, title, messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages must be a non-empty array' });
    }

    let session;

    if (sessionId) {
      // Update existing session
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (!session) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
      session.messages = messages;
      if (title) session.title = title;
      await session.save();
    } else {
      // Create new session
      const firstMessageText = messages[0]?.text || 'New Conversation';
      const sessionTitle = title || (firstMessageText.length > 50 ? firstMessageText.substring(0, 47) + '...' : firstMessageText);
      
      session = await ChatSession.create({
        user: req.user._id,
        title: sessionTitle,
        messages
      });
    }

    res.json({
      message: 'Chat session saved successfully',
      session: {
        _id: session._id,
        title: session.title,
        updatedAt: session.updatedAt,
        messages: session.messages
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat session', message: error.message });
  }
};

// Get the full message details of a specific chat session to resume it
exports.getSessionById = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat session details' });
  }
};
