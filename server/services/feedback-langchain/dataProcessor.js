const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { feedbackVectorStore } = require('./vectorStore');
const { feedbackLLMService } = require('./llmService');
const { logger } = require('../../utils/logger');

class FeedbackDataProcessor {
  constructor() {
    this.processingStats = {
      total: 0,
      processed: 0,
      failed: 0,
      skipped: 0
    };
  }

  async loadCSVFeedback(csvFilePath) {
    try {
      const feedback = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', (row) => {
            try {
              // Parse the CSV row - adjust field names based on your CSV structure
              const feedbackItem = this.parseCSVRow(row);
              if (feedbackItem) {
                feedback.push(feedbackItem);
              }
            } catch (error) {
              logger.warn(`Failed to parse CSV row: ${error.message}`);
            }
          })
          .on('end', () => {
            logger.info(`Loaded ${feedback.length} feedback items from CSV`);
            resolve(feedback);
          })
          .on('error', (error) => {
            logger.error(`Error reading CSV file: ${error.message}`);
            reject(error);
          });
      });
    } catch (error) {
      logger.error('Error loading CSV feedback:', error);
      throw error;
    }
  }

  parseCSVRow(row) {
    try {
      // Extract data from CSV row - adjust based on your CSV format
      const keys = Object.keys(row);
      const firstKey = keys[0]; // The CSV seems to have all data in first column
      
      if (firstKey && row[firstKey]) {
        // Parse the comma-separated values in the first column
        const values = this.parseCommaSeparatedValues(row[firstKey]);
        
        if (values.length >= 6) {
          return {
            text: this.cleanText(values[0]),
            sentiment: this.cleanText(values[1]),
            source: this.cleanText(values[2]),
            date: this.cleanText(values[3]),
            userId: this.cleanText(values[4]),
            location: this.cleanText(values[5]),
            confidence: values[6] ? parseFloat(this.cleanText(values[6])) : null
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.warn(`Error parsing CSV row: ${error.message}`);
      return null;
    }
  }

  parseCommaSeparatedValues(str) {
    // Handle quoted CSV values properly
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < str.length) {
      const char = str[i];
      
      if (char === '"') {
        if (inQuotes && str[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last value
    if (current) {
      values.push(current.trim());
    }
    
    return values;
  }

  cleanText(text) {
    if (!text) return '';
    return text.replace(/^["']|["']$/g, '').trim();
  }

  async processAndStoreFeedback(feedbackData) {
    try {
      this.processingStats = {
        total: feedbackData.length,
        processed: 0,
        failed: 0,
        skipped: 0
      };

      const results = [];

      for (const feedback of feedbackData) {
        try {
          // Skip if essential data is missing
          if (!feedback.text || feedback.text.length < 10) {
            this.processingStats.skipped++;
            continue;
          }

          // Enhance feedback with AI analysis if needed
          const enhancedFeedback = await this.enhanceFeedback(feedback);

          // Store in vector database
          const feedbackId = await feedbackVectorStore.addFeedback(enhancedFeedback);

          results.push({
            id: feedbackId,
            ...enhancedFeedback
          });

          this.processingStats.processed++;
          
          // Log progress for large datasets
          if (this.processingStats.processed % 50 === 0) {
            logger.info(`Processed ${this.processingStats.processed}/${this.processingStats.total} feedback items`);
          }

        } catch (error) {
          logger.error(`Error processing feedback item: ${error.message}`);
          this.processingStats.failed++;
        }
      }

      logger.info('Feedback processing completed:', this.processingStats);
      return results;
    } catch (error) {
      logger.error('Error in processAndStoreFeedback:', error);
      throw error;
    }
  }

  async enhanceFeedback(feedback) {
    try {
      const enhanced = { ...feedback };

      // If sentiment is missing or unclear, analyze it
      if (!feedback.sentiment || feedback.sentiment.toLowerCase() === 'unknown') {
        try {
          const sentimentAnalysis = await feedbackLLMService.analyzeText(feedback.text, 'sentiment');
          enhanced.sentiment = sentimentAnalysis.sentiment;
          enhanced.sentimentConfidence = sentimentAnalysis.confidence;
          enhanced.sentimentReasoning = sentimentAnalysis.reasoning;
        } catch (error) {
          logger.warn(`Failed to analyze sentiment: ${error.message}`);
        }
      }

      // Extract themes and topics
      try {
        const themeAnalysis = await feedbackLLMService.analyzeText(feedback.text, 'themes');
        enhanced.themes = themeAnalysis.themes;
        enhanced.topics = themeAnalysis.topics;
        enhanced.categories = themeAnalysis.categories;
        enhanced.keyPhrases = themeAnalysis.key_phrases;
      } catch (error) {
        logger.warn(`Failed to analyze themes: ${error.message}`);
      }

      // Extract emotions
      try {
        const emotionAnalysis = await feedbackLLMService.analyzeText(feedback.text, 'emotion');
        enhanced.primaryEmotion = emotionAnalysis.primary_emotion;
        enhanced.emotions = emotionAnalysis.emotions;
        enhanced.emotionIntensity = emotionAnalysis.intensity;
      } catch (error) {
        logger.warn(`Failed to analyze emotions: ${error.message}`);
      }

      // Add processing metadata
      enhanced.processedAt = new Date().toISOString();
      enhanced.enhanced = true;

      return enhanced;
    } catch (error) {
      logger.error('Error enhancing feedback:', error);
      return feedback; // Return original if enhancement fails
    }
  }

  async loadFromCSVFile(filePath = null) {
    try {
      // Default to the feedback.csv in client/public
      const csvPath = filePath || path.join(__dirname, '../../../client/public/feedback.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found: ${csvPath}`);
      }

      logger.info(`Loading feedback from: ${csvPath}`);
      
      // Load and process feedback
      const feedbackData = await this.loadCSVFeedback(csvPath);
      const processedFeedback = await this.processAndStoreFeedback(feedbackData);
      
      return {
        stats: this.processingStats,
        processed: processedFeedback,
        vectorStoreStats: await feedbackVectorStore.getStats()
      };
    } catch (error) {
      logger.error('Error loading feedback from CSV:', error);
      throw error;
    }
  }

  getProcessingStats() {
    return this.processingStats;
  }
}

// Create singleton instance
const feedbackDataProcessor = new FeedbackDataProcessor();

module.exports = {
  FeedbackDataProcessor,
  feedbackDataProcessor,
};
