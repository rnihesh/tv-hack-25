const CommunityMessage = require('../models/CommunityMessage');
const { logger } = require('../utils/logger');

// Get all community messages
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, topic } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (topic) {
      query.topics = { $in: [topic] };
    }

    const messages = await CommunityMessage
      .find(query)
      .populate('author', 'companyName businessType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CommunityMessage.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching community messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community messages'
    });
  }
};

// Post a new community message
const postMessage = async (req, res) => {
  try {
    const { content, topics = [] } = req.body;
    const companyId = req.user.companyId;

    const message = new CommunityMessage({
      content,
      topics,
      author: companyId
    });

    await message.save();
    await message.populate('author', 'companyName businessType');

    logger.info(`Community message posted by company: ${companyId}`);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Error posting community message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to post message'
    });
  }
};

// Get messages by topic
const getMessagesByTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await CommunityMessage
      .find({ topics: { $in: [topic] } })
      .populate('author', 'companyName businessType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CommunityMessage.countDocuments({ topics: { $in: [topic] } });

    res.json({
      success: true,
      data: {
        messages,
        topic,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching messages by topic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages by topic'
    });
  }
};

// Toggle like on a message
const toggleLike = async (req, res) => {
  try {
    const { messageId } = req.params;
    const companyId = req.user.companyId;

    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const likeIndex = message.likes.indexOf(companyId);
    if (likeIndex > -1) {
      // Unlike
      message.likes.splice(likeIndex, 1);
    } else {
      // Like
      message.likes.push(companyId);
    }

    await message.save();

    res.json({
      success: true,
      data: {
        messageId,
        likes: message.likes.length,
        isLiked: message.likes.includes(companyId)
      }
    });
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const companyId = req.user.companyId;

    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    await CommunityMessage.findByIdAndDelete(messageId);

    logger.info(`Community message deleted by company: ${companyId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

// Get community stats
const getCommunityStats = async (req, res) => {
  try {
    const totalMessages = await CommunityMessage.countDocuments();
    const totalAuthors = await CommunityMessage.distinct('author').length;
    
    // Get popular topics
    const topicAggregation = await CommunityMessage.aggregate([
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const popularTopics = topicAggregation.map(item => ({
      topic: item._id,
      count: item.count
    }));

    res.json({
      success: true,
      data: {
        totalMessages,
        totalAuthors,
        popularTopics
      }
    });
  } catch (error) {
    logger.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community stats'
    });
  }
};

module.exports = {
  getMessages,
  postMessage,
  getMessagesByTopic,
  toggleLike,
  deleteMessage,
  getCommunityStats
};
