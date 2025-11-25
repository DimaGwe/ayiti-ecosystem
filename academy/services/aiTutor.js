/**
 * AI Tutor Service
 * Handles AI-powered responses using DeepSeek API
 * Now with database-driven configuration
 */

const fs = require('fs');
const path = require('path');

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Get AI settings from database
 */
async function getSettings() {
  try {
    const { Setting } = require('../models');
    return await Setting.getAITutorSettings();
  } catch (err) {
    console.error('Error loading AI settings from DB:', err.message);
    // Return defaults if DB not available
    return {
      enabled: true,
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: getDefaultInstructions(),
      courseInstructions: {}
    };
  }
}

/**
 * Load course instruction file (fallback)
 * @param {string} courseId - Course identifier
 * @returns {string} Course instructions content
 */
function loadCourseInstructionsFromFile(courseId) {
  const instructionsPath = path.join(__dirname, '../data/course-instructions', `${courseId}.md`);

  try {
    if (fs.existsSync(instructionsPath)) {
      return fs.readFileSync(instructionsPath, 'utf-8');
    }
  } catch (err) {
    console.error(`Error loading instructions for ${courseId}:`, err.message);
  }

  return null;
}

/**
 * Default instructions
 */
function getDefaultInstructions() {
  return `You are an AI Tutor for Haiti Skills Academy, an educational platform teaching practical skills to students in Haiti.

Your role:
- Help students understand course material
- Answer questions about Agriculture, Mechanic, Fishing, Boat Building, and Recycling courses
- Provide encouragement and support
- Explain concepts in simple, clear language
- When relevant, connect lessons to real-world applications in Haiti

Guidelines:
- Be patient and supportive
- Use examples relevant to Haiti when possible
- If you don't know something, say so honestly
- Keep responses focused and helpful
- Respond in the same language the student uses (Creole, French, or English)`;
}

/**
 * Build the system prompt with context
 * @param {Object} settings - AI settings from database
 * @param {Object} options - Context options
 * @returns {string} System prompt
 */
function buildSystemPrompt(settings, options = {}) {
  const { courseContext, studentName, enrolledCourses } = options;

  // Use DB system prompt or default
  let systemPrompt = settings.systemPrompt || getDefaultInstructions();

  // Add course-specific instructions
  if (courseContext) {
    // First check DB course instructions
    const dbCourseInstructions = settings.courseInstructions?.[courseContext];
    if (dbCourseInstructions) {
      systemPrompt += `\n\n## Current Course Context: ${courseContext}\n${dbCourseInstructions}`;
    } else {
      // Fallback to file-based instructions
      const fileInstructions = loadCourseInstructionsFromFile(courseContext);
      if (fileInstructions) {
        systemPrompt += `\n\n## Current Course Context: ${courseContext}\n${fileInstructions}`;
      }
    }
  }

  // Add student context
  if (studentName) {
    systemPrompt += `\n\nYou are helping a student named ${studentName}.`;
  }

  if (enrolledCourses && enrolledCourses.length > 0) {
    systemPrompt += `\nThis student is enrolled in: ${enrolledCourses.join(', ')}.`;
  }

  return systemPrompt;
}

/**
 * Get AI response from DeepSeek
 * @param {string} userMessage - The student's message
 * @param {Array} conversationHistory - Previous messages in conversation
 * @param {Object} context - Context (courseContext, studentName, etc.)
 * @returns {Object} AI response with content and metadata
 */
async function getAIResponse(userMessage, conversationHistory = [], context = {}) {
  // Get settings from database
  const settings = await getSettings();

  // Check if AI Tutor is enabled
  if (!settings.enabled) {
    return {
      success: false,
      content: "The AI Tutor is currently disabled. Please try again later.",
      error: 'AI Tutor disabled'
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not set');
    return {
      success: false,
      content: "I'm sorry, the AI Tutor is not configured yet. Please contact support.",
      error: 'API key not configured'
    };
  }

  const systemPrompt = buildSystemPrompt(settings, context);
  const model = settings.model || 'deepseek-chat';
  const temperature = settings.temperature ?? 0.7;
  const maxTokens = settings.maxTokens || 1000;

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.isFromAI ? 'assistant' : 'user',
      content: msg.content
    });
  }

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      return {
        success: false,
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return {
        success: false,
        content: "I couldn't generate a response. Please try again.",
        error: 'Empty response from API'
      };
    }

    return {
      success: true,
      content: aiMessage,
      metadata: {
        model: model,
        temperature: temperature,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };

  } catch (err) {
    console.error('AI Tutor error:', err);
    return {
      success: false,
      content: "I'm sorry, something went wrong. Please try again later.",
      error: err.message
    };
  }
}

/**
 * Load course instructions (for external use)
 */
async function loadCourseInstructions(courseId) {
  const settings = await getSettings();
  return settings.courseInstructions?.[courseId] || loadCourseInstructionsFromFile(courseId);
}

module.exports = {
  getAIResponse,
  loadCourseInstructions,
  buildSystemPrompt,
  getSettings
};
