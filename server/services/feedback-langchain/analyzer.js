const { feedbackVectorStore } = require("./vectorStore");
const { feedbackLLMService } = require("./llmService");
const { feedbackDataProcessor } = require("./dataProcessor");
const { logger } = require("../../utils/logger");

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
      logger.info("Feedback analyzer initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize feedback analyzer:", error);
      throw error;
    }
  }

  async analyzeSentimentTrends(options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const {
        timeframe = "30d", // 7d, 30d, 90d, 1y
        source = null,
        location = null,
      } = options;

      // Get all feedback with filters
      let feedback = await feedbackVectorStore.getAllFeedback();

      // Apply filters
      if (source) {
        feedback = feedback.filter((f) => f.source === source);
      }
      if (location) {
        feedback = feedback.filter((f) => f.location === location);
      }

      // Filter by timeframe
      const now = new Date();
      const timeframeDays = this.parseTimeframe(timeframe);
      const cutoffDate = new Date(
        now.getTime() - timeframeDays * 24 * 60 * 60 * 1000
      );

      feedback = feedback.filter((f) => {
        const feedbackDate = new Date(f.date || f.addedAt);
        return feedbackDate >= cutoffDate;
      });

      // Analyze sentiment trends
      const sentimentByDay = this.groupFeedbackByDay(feedback);
      const sentimentTrends = this.calculateSentimentTrends(sentimentByDay);

      // Calculate overall metrics
      const overallMetrics = this.calculateOverallMetrics(feedback);

      // Generate insights using LLM
      const insights = await this.generateTrendInsights(
        sentimentTrends,
        overallMetrics
      );

      return {
        timeframe,
        totalFeedback: feedback.length,
        sentimentTrends,
        overallMetrics,
        insights,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error analyzing sentiment trends:", error);
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
        similarityThreshold = 0.7,
      } = options;

      // Build filter object
      const filter = {};
      if (sentimentFilter) filter.sentiment = sentimentFilter;
      if (sourceFilter) filter.source = sourceFilter;

      // Search for similar feedback
      const results = await feedbackVectorStore.searchSimilarFeedback(query, {
        limit,
        filter,
        similarityThreshold,
      });

      // Enhance results with additional analysis
      const enhancedResults = await Promise.all(
        results.map(async (result) => {
          const fullFeedback = await feedbackVectorStore.getFeedbackById(
            result.feedbackId
          );
          return {
            ...result,
            fullFeedback,
            analysisScore: this.calculateAnalysisScore(result, query),
          };
        })
      );

      return {
        query,
        totalResults: enhancedResults.length,
        results: enhancedResults,
        searchedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error finding similar feedback:", error);
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
          feedbackIds.map((id) => feedbackVectorStore.getFeedbackById(id))
        );
        feedbackToAnalyze = feedbackToAnalyze.filter(Boolean); // Remove nulls
      } else {
        feedbackToAnalyze = await feedbackVectorStore.getAllFeedback();
      }

      if (feedbackToAnalyze.length === 0) {
        return { error: "No feedback found to analyze" };
      }

      // Analyze themes and patterns
      const themes = this.extractCommonThemes(feedbackToAnalyze);
      const sentimentDistribution =
        this.analyzeSentimentDistribution(feedbackToAnalyze);
      const sourceAnalysis = this.analyzeSourceDistribution(feedbackToAnalyze);
      const emotionAnalysis = this.analyzeEmotions(feedbackToAnalyze);

      // Generate LLM-powered insights
      const llmInsights = await this.generateLLMInsights(feedbackToAnalyze);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        feedbackToAnalyze,
        themes,
        sentimentDistribution
      );

      return {
        totalAnalyzed: feedbackToAnalyze.length,
        themes,
        sentimentDistribution,
        sourceAnalysis,
        emotionAnalysis,
        llmInsights,
        recommendations,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error generating feedback insights:", error);
      throw error;
    }
  }

  async answerFeedbackQuestion(question, context = {}) {
    try {
      if (!this.initialized) await this.initialize();

      // Search for relevant feedback based on the question
      const relevantFeedback = await feedbackVectorStore.searchSimilarFeedback(
        question,
        {
          limit: 15,
          similarityThreshold: 0.5,
        }
      );

      // Get additional context if specified
      let contextualFeedback = [];
      if (context.sentiment) {
        const sentimentFeedback = await feedbackVectorStore.getFeedbackByFilter(
          {
            sentiment: context.sentiment,
          }
        );
        contextualFeedback = contextualFeedback.concat(
          sentimentFeedback.slice(0, 5)
        );
      }

      // Combine all feedback for context
      const allRelevantFeedback = [...relevantFeedback, ...contextualFeedback];

      // Generate answer using LLM
      const answer = await this.generateContextualAnswer(
        question,
        allRelevantFeedback
      );

      return {
        question,
        answer,
        relevantFeedbackCount: allRelevantFeedback.length,
        sources: allRelevantFeedback.slice(0, 5), // Include top 5 sources
        answeredAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error answering feedback question:", error);
      throw error;
    }
  }

  // Helper methods
  parseTimeframe(timeframe) {
    const map = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };
    return map[timeframe] || 30;
  }

  groupFeedbackByDay(feedback) {
    const grouped = {};
    feedback.forEach((f) => {
      const date = new Date(f.date || f.addedAt).toISOString().split("T")[0];
      if (!grouped[date]) {
        grouped[date] = { positive: 0, negative: 0, neutral: 0 };
      }
      const sentiment = f.sentiment?.toLowerCase() || "neutral";
      if (sentiment === "positive") grouped[date].positive++;
      else if (sentiment === "negative") grouped[date].negative++;
      else grouped[date].neutral++;
    });
    return grouped;
  }

  calculateSentimentTrends(sentimentByDay) {
    const dates = Object.keys(sentimentByDay).sort();
    return dates.map((date) => ({
      date,
      ...sentimentByDay[date],
      total:
        sentimentByDay[date].positive +
        sentimentByDay[date].negative +
        sentimentByDay[date].neutral,
    }));
  }

  calculateOverallMetrics(feedback) {
    const total = feedback.length;
    const sentimentCounts = feedback.reduce((acc, f) => {
      const sentiment = f.sentiment?.toLowerCase() || "neutral";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      positive: sentimentCounts.positive || 0,
      negative: sentimentCounts.negative || 0,
      neutral: sentimentCounts.neutral || 0,
      positivePercentage: (
        ((sentimentCounts.positive || 0) / total) *
        100
      ).toFixed(1),
      negativePercentage: (
        ((sentimentCounts.negative || 0) / total) *
        100
      ).toFixed(1),
      neutralPercentage: (
        ((sentimentCounts.neutral || 0) / total) *
        100
      ).toFixed(1),
    };
  }

  extractCommonThemes(feedback) {
    const themeCount = {};
    feedback.forEach((f) => {
      if (f.themes && Array.isArray(f.themes)) {
        f.themes.forEach((theme) => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    });

    return Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  }

  analyzeSentimentDistribution(feedback) {
    return this.calculateOverallMetrics(feedback);
  }

  analyzeSourceDistribution(feedback) {
    const sourceCounts = feedback.reduce((acc, f) => {
      const source = f.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count }));
  }

  analyzeEmotions(feedback) {
    const emotionCounts = {};
    feedback.forEach((f) => {
      if (f.primaryEmotion) {
        emotionCounts[f.primaryEmotion] =
          (emotionCounts[f.primaryEmotion] || 0) + 1;
      }
    });

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  calculateAnalysisScore(result, query) {
    // Simple scoring based on similarity and metadata
    let score = result.similarity * 100;

    // Boost score for exact keyword matches
    const queryWords = query.toLowerCase().split(" ");
    const contentWords = result.content.toLowerCase().split(" ");
    const matches = queryWords.filter((word) =>
      contentWords.includes(word)
    ).length;
    score += matches * 5;

    return Math.min(score, 100).toFixed(1);
  }

  async generateTrendInsights(trends, metrics) {
    try {
      const systemPrompt = `You are an expert business analyst specializing in customer feedback trend analysis. Analyze sentiment trends and provide actionable business insights.

Your analysis should focus on:
- Identifying significant trend patterns (increasing/decreasing sentiment)
- Highlighting concerning downward trends
- Recognizing positive momentum
- Providing specific, actionable business recommendations
- Connecting trends to potential business causes and effects

Provide clear, concise insights that business stakeholders can understand and act upon.`;

      const userPrompt = `Analyze these customer feedback sentiment trends and metrics:

**Recent Sentiment Trends (last 7 days):**
${JSON.stringify(trends.slice(-7), null, 2)}

**Overall Metrics:**
${JSON.stringify(metrics, null, 2)}

Based on this data, provide insights in this JSON format:
{
  "key_trends": [
    "Specific trend observation 1",
    "Specific trend observation 2", 
    "Specific trend observation 3"
  ],
  "concerns": [
    "Specific area of concern 1",
    "Specific area of concern 2"
  ],
  "opportunities": [
    "Specific opportunity 1",
    "Specific opportunity 2"
  ],
  "summary": "2-3 sentence executive summary of the most important findings",
  "trend_direction": "improving|declining|stable",
  "confidence_level": "high|medium|low",
  "recommended_actions": [
    "Immediate action 1",
    "Immediate action 2"
  ]
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ]);

      try {
        // Enhanced JSON parsing
        let cleanResponse = response.trim();
        cleanResponse = cleanResponse
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "");

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanResponse);

        // Validate required fields
        if (!parsed.summary) {
          parsed.summary = "Trend analysis completed";
        }

        return parsed;
      } catch (parseError) {
        logger.warn("Failed to parse trend insights JSON:", parseError.message);
        return {
          summary: response,
          key_trends: ["Unable to parse detailed trends"],
          concerns: [],
          opportunities: [],
          trend_direction: "stable",
          confidence_level: "low",
        };
      }
    } catch (error) {
      logger.error("Error generating trend insights:", error);
      return {
        summary: "Unable to generate insights at this time",
        key_trends: [],
        concerns: ["Analysis temporarily unavailable"],
        opportunities: [],
        trend_direction: "unknown",
        confidence_level: "low",
      };
    }
  }

  async generateLLMInsights(feedback) {
    try {
      const feedbackSample = feedback.slice(0, 15).map((f) => ({
        text: f.text?.substring(0, 200) + (f.text?.length > 200 ? "..." : ""), // Limit text length
        sentiment: f.sentiment,
        themes: f.themes || [],
        source: f.source,
      }));

      const systemPrompt = `You are an expert business intelligence analyst specializing in customer feedback analysis. Your role is to extract actionable business insights from customer feedback data that can drive strategic decision-making.

Focus on:
- Identifying specific customer pain points that impact business
- Highlighting positive aspects that drive customer satisfaction  
- Recommending concrete improvement areas
- Assessing business impact and urgency
- Providing actionable next steps for business teams

Analyze patterns across feedback to provide strategic value.`;

      const userPrompt = `Analyze this customer feedback data and provide comprehensive business insights:

**Feedback Sample (${feedbackSample.length} items):**
${JSON.stringify(feedbackSample, null, 2)}

**Total Feedback Analyzed:** ${feedback.length} items

Provide insights in this JSON format:
{
  "customer_pain_points": [
    "Specific pain point 1 with business impact",
    "Specific pain point 2 with business impact"
  ],
  "positive_highlights": [
    "What customers love most",
    "Competitive advantages identified"
  ],
  "improvement_areas": [
    "Priority area 1 for improvement",
    "Priority area 2 for improvement"
  ],
  "business_impact": "Detailed assessment of how feedback affects business performance, revenue, and growth",
  "urgency_level": "high|medium|low",
  "action_items": [
    "Immediate action 1 with responsible team",
    "Short-term action 2 with timeline"
  ],
  "customer_segments": [
    "Key customer segment insights"
  ],
  "competitive_insights": "What feedback reveals about market position"
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ]);

      try {
        // Enhanced JSON parsing for insights
        let cleanResponse = response.trim();
        cleanResponse = cleanResponse
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "");

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanResponse);

        // Ensure required fields exist
        if (!parsed.business_impact) {
          parsed.business_impact =
            "Analysis of customer feedback patterns and trends";
        }
        if (!parsed.customer_pain_points) {
          parsed.customer_pain_points = [];
        }
        if (!parsed.action_items) {
          parsed.action_items = [];
        }

        return parsed;
      } catch (parseError) {
        logger.warn("Failed to parse LLM insights JSON:", parseError.message);
        return {
          business_impact: response,
          customer_pain_points: [],
          positive_highlights: [],
          improvement_areas: [],
          action_items: [],
          urgency_level: "medium",
        };
      }
    } catch (error) {
      logger.error("Error generating LLM insights:", error);
      return {
        business_impact: "Unable to generate insights at this time",
        customer_pain_points: [],
        positive_highlights: [],
        improvement_areas: [],
        action_items: ["Review feedback manually"],
        urgency_level: "low",
      };
    }
  }

  async generateRecommendations(feedback, themes, sentimentDist) {
    try {
      const negativeFeedback = feedback
        .filter((f) => f.sentiment?.toLowerCase() === "negative")
        .slice(0, 8);

      const systemPrompt = `You are a senior business consultant specializing in customer experience improvement. Based on feedback analysis, provide specific, actionable recommendations that businesses can implement to improve customer satisfaction and business performance.

Your recommendations should be:
- Specific and actionable
- Prioritized by impact and feasibility  
- Includes success metrics
- Considers both immediate fixes and long-term strategies
- Based on actual feedback patterns

Focus on practical solutions that deliver measurable business results.`;

      const userPrompt = `Based on this customer feedback analysis, provide actionable business recommendations:

**Common Themes:** ${JSON.stringify(themes)}
**Sentiment Distribution:** ${JSON.stringify(sentimentDist)}

**Sample Negative Feedback:**
${JSON.stringify(
  negativeFeedback.map((f) => ({
    text: f.text?.substring(0, 150) + (f.text?.length > 150 ? "..." : ""),
    themes: f.themes || [],
    source: f.source,
  })),
  null,
  2
)}

Provide recommendations in this JSON format:
{
  "immediate_actions": [
    "Quick win 1 (1-2 weeks implementation)",
    "Quick win 2 (1-2 weeks implementation)"
  ],
  "short_term_strategies": [
    "Strategy 1 (1-3 months)",
    "Strategy 2 (1-3 months)"
  ],
  "long_term_strategies": [
    "Long-term initiative 1 (3-12 months)",
    "Long-term initiative 2 (3-12 months)"
  ],
  "priority_areas": [
    "Highest priority area to focus on",
    "Second priority area"
  ],
  "success_metrics": [
    "Metric 1 to track improvement",
    "Metric 2 to track improvement"
  ],
  "resource_requirements": [
    "Required resource 1",
    "Required resource 2"
  ],
  "expected_impact": "high|medium|low",
  "investment_level": "high|medium|low"
}`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ]);

      try {
        // Enhanced JSON parsing for recommendations
        let cleanResponse = response.trim();
        cleanResponse = cleanResponse
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "");

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanResponse);

        // Ensure required fields exist
        if (
          !parsed.immediate_actions ||
          parsed.immediate_actions.length === 0
        ) {
          parsed.immediate_actions = [
            "Review and analyze customer feedback patterns",
          ];
        }
        if (!parsed.priority_areas) {
          parsed.priority_areas = ["Customer experience improvement"];
        }
        if (!parsed.success_metrics) {
          parsed.success_metrics = [
            "Customer satisfaction score",
            "Net Promoter Score",
          ];
        }

        return parsed;
      } catch (parseError) {
        logger.warn(
          "Failed to parse recommendations JSON:",
          parseError.message
        );
        return {
          immediate_actions: [
            response.substring(0, 200) + (response.length > 200 ? "..." : ""),
          ],
          short_term_strategies: [],
          long_term_strategies: [],
          priority_areas: ["Customer feedback analysis"],
          success_metrics: ["Customer satisfaction improvement"],
          expected_impact: "medium",
          investment_level: "medium",
        };
      }
    } catch (error) {
      logger.error("Error generating recommendations:", error);
      return {
        immediate_actions: [
          "Review feedback manually",
          "Identify key issues from customer comments",
        ],
        short_term_strategies: [
          "Implement customer feedback collection system",
        ],
        long_term_strategies: [
          "Develop comprehensive customer experience strategy",
        ],
        priority_areas: ["Customer service improvement"],
        success_metrics: ["Customer satisfaction score"],
        expected_impact: "medium",
        investment_level: "low",
      };
    }
  }

  async generateContextualAnswer(question, relevantFeedback) {
    try {
      const context = relevantFeedback.map((rf) => ({
        text: rf.fullFeedback?.text || rf.content,
        sentiment: rf.fullFeedback?.sentiment || rf.metadata?.sentiment,
        source: rf.fullFeedback?.source || rf.metadata?.source,
        themes: rf.fullFeedback?.themes || [],
      }));

      const systemPrompt = `You are an expert customer feedback analyst helping business stakeholders understand their customer feedback data. Provide comprehensive, data-driven answers that help make informed business decisions.

Guidelines for your responses:
- Use specific examples from the actual feedback provided
- Identify patterns and trends in the data
- Provide actionable insights and recommendations
- Connect feedback to potential business impact
- Be specific about what the feedback reveals
- Suggest next steps or areas for investigation

Always ground your analysis in the actual feedback data provided.`;

      const userPrompt = `Answer this question about customer feedback using the provided context:

**Question:** ${question}

**Relevant Feedback Context (${context.length} items):**
${JSON.stringify(context, null, 2)}

Provide a comprehensive answer that:
1. Directly addresses the specific question asked
2. Uses specific examples and quotes from the feedback
3. Identifies patterns or trends in the responses
4. Provides actionable business insights
5. Suggests relevant follow-up actions or investigations

**Answer:**`;

      const response = await feedbackLLMService.generateResponse([
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ]);

      return response;
    } catch (error) {
      logger.error("Error generating contextual answer:", error);
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
