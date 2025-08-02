const { feedbackVectorStore } = require('./vectorStore');
const { feedbackLLMService } = require('./llmService');
const { feedbackDataProcessor } = require('./dataProcessor');
const { logger } = require('../../utils/logger');

class FeedbackAnalyzer {
  constructor() {
    this.initialized = false;
    this.analysisCache = new Map();
  }

  async initialize() {
    try {
      // Initialize all components
      await feedbackVectorStore.initialize();
      await feedbackLLMService.initialize();
      
      this.initialized = true;
      logger.info('Feedback analyzer initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize feedback analyzer:', error);
      throw error;
    }
  }

  async analyzeSentimentTrends(options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const {
        timeframe = '30d', // 7d, 30d, 90d, 1y
        source = null,
        location = null
      } = options;

      // Get all feedback with filters
      let feedback = await feedbackVectorStore.getAllFeedback();
      
      // Apply filters
      if (source) {
        feedback = feedback.filter(f => f.source === source);
      }
      if (location) {
        feedback = feedback.filter(f => f.location === location);
      }

      // Filter by timeframe
      const now = new Date();
      const timeframeDays = this.parseTimeframe(timeframe);
      const cutoffDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));
      
      feedback = feedback.filter(f => {
        const feedbackDate = new Date(f.date || f.addedAt);
        return feedbackDate >= cutoffDate;
      });

      // Analyze sentiment trends
      const sentimentByDay = this.groupFeedbackByDay(feedback);
      const sentimentTrends = this.calculateSentimentTrends(sentimentByDay);
      
      // Calculate overall metrics
      const overallMetrics = this.calculateOverallMetrics(feedback);
      
      // Generate insights using LLM
      const insights = await this.generateTrendInsights(sentimentTrends, overallMetrics);

      return {
        timeframe,
        totalFeedback: feedback.length,
        sentimentTrends,
        overallMetrics,
        insights,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error analyzing sentiment trends:', error);
      throw error;
    }
  }

  async findSimilarFeedback(query, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const {
        limit = 10,
        sentimentFilter = null,
        sourceFilter = null,
        similarityThreshold = 0.7
      } = options;

      // Build filter object
      const filter = {};
      if (sentimentFilter) filter.sentiment = sentimentFilter;
      if (sourceFilter) filter.source = sourceFilter;

      // Search for similar feedback
      const results = await feedbackVectorStore.searchSimilarFeedback(query, {
        limit,
        filter,
        similarityThreshold
      });

      // Enhance results with additional analysis
      const enhancedResults = await Promise.all(
        results.map(async (result) => {
          const fullFeedback = await feedbackVectorStore.getFeedbackById(result.feedbackId);
          return {
            ...result,
            fullFeedback,
            analysisScore: this.calculateAnalysisScore(result, query)
          };
        })
      );

      return {
        query,
        totalResults: enhancedResults.length,
        results: enhancedResults,
        searchedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error finding similar feedback:', error);
      throw error;
    }
  }

  async generateFeedbackInsights(feedbackIds = null) {
    try {
      if (!this.initialized) await this.initialize();

      // Get feedback to analyze
      let feedbackToAnalyze;
      if (feedbackIds && feedbackIds.length > 0) {
        feedbackToAnalyze = await Promise.all(
          feedbackIds.map(id => feedbackVectorStore.getFeedbackById(id))
        );
        feedbackToAnalyze = feedbackToAnalyze.filter(Boolean); // Remove nulls
      } else {
        feedbackToAnalyze = await feedbackVectorStore.getAllFeedback();
      }

      if (feedbackToAnalyze.length === 0) {
        return { error: 'No feedback found to analyze' };
      }

      // Analyze themes and patterns
      const themes = this.extractCommonThemes(feedbackToAnalyze);
      const sentimentDistribution = this.analyzeSentimentDistribution(feedbackToAnalyze);
      const sourceAnalysis = this.analyzeSourceDistribution(feedbackToAnalyze);
      const emotionAnalysis = this.analyzeEmotions(feedbackToAnalyze);
      
      // Generate LLM-powered insights
      const llmInsights = await this.generateLLMInsights(feedbackToAnalyze);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(feedbackToAnalyze, themes, sentimentDistribution);

      return {
        totalAnalyzed: feedbackToAnalyze.length,
        themes,
        sentimentDistribution,
        sourceAnalysis,
        emotionAnalysis,
        llmInsights,
        recommendations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating feedback insights:', error);
      throw error;
    }
  }

  async answerFeedbackQuestion(question, context = {}) {
    try {
      if (!this.initialized) await this.initialize();

      // Search for relevant feedback based on the question
      const relevantFeedback = await feedbackVectorStore.searchSimilarFeedback(question, {
        limit: 15,
        similarityThreshold: 0.5
      });

      // Get additional context if specified
      let contextualFeedback = [];
      if (context.sentiment) {
        const sentimentFeedback = await feedbackVectorStore.getFeedbackByFilter({
          sentiment: context.sentiment
        });
        contextualFeedback = contextualFeedback.concat(sentimentFeedback.slice(0, 5));
      }

      // Combine all feedback for context
      const allRelevantFeedback = [...relevantFeedback, ...contextualFeedback];
      
      // Generate answer using LLM
      const answer = await this.generateContextualAnswer(question, allRelevantFeedback);

      return {
        question,
        answer,
        relevantFeedbackCount: allRelevantFeedback.length,
        sources: allRelevantFeedback.slice(0, 5), // Include top 5 sources
        answeredAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error answering feedback question:', error);
      throw error;
    }
  }

  // Helper methods
  parseTimeframe(timeframe) {
    const map = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return map[timeframe] || 30;
  }

  groupFeedbackByDay(feedback) {
    const grouped = {};
    feedback.forEach(f => {
      const date = new Date(f.date || f.addedAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { positive: 0, negative: 0, neutral: 0 };
      }
      const sentiment = f.sentiment?.toLowerCase() || 'neutral';
      if (sentiment === 'positive') grouped[date].positive++;
      else if (sentiment === 'negative') grouped[date].negative++;
      else grouped[date].neutral++;
    });
    return grouped;
  }

  calculateSentimentTrends(sentimentByDay) {
    const dates = Object.keys(sentimentByDay).sort();
    return dates.map(date => ({
      date,
      ...sentimentByDay[date],
      total: sentimentByDay[date].positive + sentimentByDay[date].negative + sentimentByDay[date].neutral
    }));
  }

  calculateOverallMetrics(feedback) {
    const total = feedback.length;
    const sentimentCounts = feedback.reduce((acc, f) => {
      const sentiment = f.sentiment?.toLowerCase() || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      positive: sentimentCounts.positive || 0,
      negative: sentimentCounts.negative || 0,
      neutral: sentimentCounts.neutral || 0,
      positivePercentage: ((sentimentCounts.positive || 0) / total * 100).toFixed(1),
      negativePercentage: ((sentimentCounts.negative || 0) / total * 100).toFixed(1),
      neutralPercentage: ((sentimentCounts.neutral || 0) / total * 100).toFixed(1)
    };
  }

  extractCommonThemes(feedback) {
    const themeCount = {};
    feedback.forEach(f => {
      if (f.themes && Array.isArray(f.themes)) {
        f.themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    });

    return Object.entries(themeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  }

  analyzeSentimentDistribution(feedback) {
    return this.calculateOverallMetrics(feedback);
  }

  analyzeSourceDistribution(feedback) {
    const sourceCounts = feedback.reduce((acc, f) => {
      const source = f.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([source, count]) => ({ source, count }));
  }

  analyzeEmotions(feedback) {
    const emotionCounts = {};
    feedback.forEach(f => {
      if (f.primaryEmotion) {
        emotionCounts[f.primaryEmotion] = (emotionCounts[f.primaryEmotion] || 0) + 1;
      }
    });

    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  calculateAnalysisScore(result, query) {
    // Simple scoring based on similarity and metadata
    let score = result.similarity * 100;
    
    // Boost score for exact keyword matches
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = result.content.toLowerCase().split(' ');
    const matches = queryWords.filter(word => contentWords.includes(word)).length;
    score += matches * 5;

    return Math.min(score, 100).toFixed(1);
  }

  async generateTrendInsights(trends, metrics) {
    try {
      const prompt = `Based on the following sentiment trend data and metrics, provide key insights about customer feedback patterns:

Sentiment Trends: ${JSON.stringify(trends.slice(-7))} (last 7 days)
Overall Metrics: ${JSON.stringify(metrics)}

Please provide insights in JSON format:
{
  "key_trends": ["trend1", "trend2", "trend3"],
  "concerns": ["concern1", "concern2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "summary": "brief overall summary"
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: prompt }
      ]);

      try {
        return JSON.parse(response);
      } catch {
        return { summary: response };
      }
    } catch (error) {
      logger.error('Error generating trend insights:', error);
      return { summary: "Unable to generate insights at this time" };
    }
  }

  async generateLLMInsights(feedback) {
    try {
      const feedbackSample = feedback.slice(0, 20).map(f => ({
        text: f.text,
        sentiment: f.sentiment,
        themes: f.themes
      }));

      const prompt = `Analyze the following customer feedback and provide business insights:

${JSON.stringify(feedbackSample, null, 2)}

Provide insights in JSON format:
{
  "customer_pain_points": ["pain1", "pain2"],
  "positive_highlights": ["highlight1", "highlight2"],
  "improvement_areas": ["area1", "area2"],
  "business_impact": "description of business impact",
  "action_items": ["action1", "action2"]
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: prompt }
      ]);

      try {
        return JSON.parse(response);
      } catch {
        return { business_impact: response };
      }
    } catch (error) {
      logger.error('Error generating LLM insights:', error);
      return { business_impact: "Unable to generate insights at this time" };
    }
  }

  async generateRecommendations(feedback, themes, sentimentDist) {
    try {
      const negativeFeedback = feedback.filter(f => 
        f.sentiment?.toLowerCase() === 'negative'
      ).slice(0, 10);

      const prompt = `Based on customer feedback analysis, provide actionable business recommendations:

Common Themes: ${JSON.stringify(themes)}
Sentiment Distribution: ${JSON.stringify(sentimentDist)}
Recent Negative Feedback: ${JSON.stringify(negativeFeedback.map(f => f.text))}

Provide recommendations in JSON format:
{
  "immediate_actions": ["action1", "action2"],
  "long_term_strategies": ["strategy1", "strategy2"],
  "priority_areas": ["area1", "area2"],
  "success_metrics": ["metric1", "metric2"]
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: prompt }
      ]);

      try {
        return JSON.parse(response);
      } catch {
        return { immediate_actions: [response] };
      }
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return { immediate_actions: ["Review feedback manually"] };
    }
  }

  async generateContextualAnswer(question, relevantFeedback) {
    try {
      const context = relevantFeedback.map(rf => ({
        text: rf.fullFeedback?.text || rf.content,
        sentiment: rf.fullFeedback?.sentiment || rf.metadata?.sentiment,
        source: rf.fullFeedback?.source || rf.metadata?.source
      }));

      const prompt = `Answer the following question about customer feedback using the provided context:

Question: ${question}

Relevant Feedback Context:
${JSON.stringify(context, null, 2)}

Provide a comprehensive answer that:
1. Directly addresses the question
2. Uses specific examples from the feedback
3. Provides actionable insights
4. Mentions relevant patterns or trends

Answer:`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: prompt }
      ]);

      return response;
    } catch (error) {
      logger.error('Error generating contextual answer:', error);
      return "I'm unable to answer that question at the moment. Please try again later.";
    }
  }
}

// Create singleton instance
const feedbackAnalyzer = new FeedbackAnalyzer();

module.exports = {
  FeedbackAnalyzer,
  feedbackAnalyzer,
};
