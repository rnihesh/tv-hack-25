# Ollama to Gemini API Fallback Mechanism

## Overview

The AI Digital Toolkit now includes a robust fallback mechanism that automatically switches from Ollama to Gemini API when Ollama is not available or not responding. This ensures uninterrupted AI functionality for all business operations.

## How It Works

### 1. Model Initialization

- Both Gemini and Ollama models are initialized at startup
- If Ollama URL is not configured or initialization fails, only Gemini is available
- If Gemini API key is missing, only Ollama is available (if running)

### 2. Health Checking

- **Basic Health Check**: Tests model connectivity with a simple prompt
- **Enhanced Health Check**: Used for task-specific model selection
- Models are automatically marked as healthy/unhealthy based on response

### 3. Model Selection Strategies

#### Basic Selection (`getBestModelForTask`)

- Uses predefined preferences for different task types
- Returns the first available model from the preference list
- Does not test connectivity (faster but may return unavailable models)

#### Enhanced Selection (`getBestWorkingModelForTask`)

- Tests each preferred model's health before selection
- Falls back to alternative models if preferred ones fail
- Guarantees a working model is returned (if any are available)

### 4. Automatic Fallback During Invocation

- If a requested model fails during invocation, automatic fallback occurs
- Emergency fallback attempts to use any available working model
- All fallback events are logged for monitoring

## Task-Specific Model Preferences

```javascript
const taskPreferences = {
  email_generation: ["ollama-llama3", "gemini-2.5-flash"],
  website_generation: ["gemini-2.5-flash", "ollama-llama3"],
  chatbot: ["ollama-llama3", "gemini-2.5-flash"],
  image_generation: ["gemini-2.5-flash", "ollama-llama3"],
  general: ["gemini-2.5-flash", "ollama-llama3"],
};
```

## Fallback Scenarios Tested

### ✅ Scenario 1: Ollama Running and Healthy

- **Result**: Uses appropriate model based on task preferences
- **Email generation**: Uses `ollama-llama3`
- **Website generation**: Uses `gemini-2.5-flash`
- **Chatbot**: Uses `ollama-llama3`

### ✅ Scenario 2: Ollama Down/Unavailable

- **Result**: Automatically falls back to `gemini-2.5-flash` for all tasks
- **Fallback detection**: Health checks fail for Ollama models
- **Automatic recovery**: All operations continue seamlessly with Gemini

### ✅ Scenario 3: Specific Model Request Fails

- **Test**: Explicitly request `ollama-llama3` when Ollama is down
- **Result**: Emergency fallback to `gemini-2.5-flash`
- **Logging**: Clear indication of fallback usage in logs

## Implementation Details

### Enhanced Model Manager Features

1. **Robust Initialization**

   ```javascript
   initializeModels() {
     // Individual model initialization with error handling
     // Continues even if one model fails
   }
   ```

2. **Health-Aware Selection**

   ```javascript
   async getBestWorkingModelForTask(taskType) {
     // Tests each model before selection
     // Returns first working model from preferences
   }
   ```

3. **Automatic Fallback in Invocation**
   ```javascript
   async invokeWithMetrics(modelName, prompt, options) {
     // Primary model attempt
     // Automatic fallback on failure
     // Emergency fallback if needed
   }
   ```

### Contextual Chains Integration

The contextual chains (used for website generation, email generation, etc.) now:

- Use the enhanced model selection by default
- Log all fallback events
- Track model usage for analytics
- Preserve context even when models switch

## Monitoring and Logging

### Health Check Logs

```
✅ gemini-2.5-flash: healthy (Response time: 776ms)
❌ ollama-llama3: unhealthy (Error: fetch failed)
```

### Fallback Event Logs

```
[warn]: Model ollama-llama3 failed test for email_generation
[info]: Selected working model for email_generation: gemini-2.5-flash
[warn]: Model ollama-llama3 failed, attempting emergency fallback
[info]: Trying emergency fallback model: gemini-2.5-flash
```

### Response Metadata

```javascript
{
  content: "AI response content",
  modelUsed: "gemini-2.5-flash",
  originalModelRequested: "ollama-llama3",
  fallbackUsed: false,
  emergencyFallbackUsed: true,
  metrics: { duration: 637, tokenUsage: { total: 13 } }
}
```

## Configuration

### Environment Variables

```bash
# Gemini API (required for fallback)
GEMINI_API_KEY=your_gemini_api_key

# Ollama Configuration (optional)
OLLAMA_URL=http://localhost:11434  # Default value
```

### Recommended Setup

1. **Always configure Gemini API key** - This serves as the reliable fallback
2. **Configure Ollama URL** - For local/cost-effective processing when available
3. **Monitor logs** - Watch for fallback events to detect Ollama issues

## Testing

Run the comprehensive fallback test:

```bash
cd server
node test-ollama-fallback.js
```

This test verifies:

- Model initialization
- Health checking
- Task-specific selection
- Actual invocation with fallback
- Environment configuration
- Service connectivity

## Benefits

1. **Reliability**: Operations continue even if Ollama fails
2. **Performance**: Uses fast local models when available
3. **Cost Optimization**: Prefers free local models, falls back to paid API
4. **Transparency**: Clear logging of all fallback events
5. **Flexibility**: Easy to add new models or change preferences

## Next Steps

1. **Monitor production logs** for fallback frequency
2. **Consider adding more models** (Claude, GPT-4, etc.)
3. **Implement model performance metrics** for better selection
4. **Add user notifications** for extended Ollama outages
