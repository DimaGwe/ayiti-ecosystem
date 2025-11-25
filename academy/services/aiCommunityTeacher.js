/**
 * AI Community Teacher Service
 * Handles AI-powered community teaching - posts, comments, discussions
 * Each AI teacher owns a community and teaches based on admin-defined curriculum
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Get AI Teacher by ID or slug
 */
async function getAITeacher(idOrSlug) {
  const { AICommunityTeacher, Community, Course } = require('../models');

  const where = isNaN(idOrSlug)
    ? { slug: idOrSlug }
    : { id: idOrSlug };

  return await AICommunityTeacher.findOne({
    where,
    include: [
      { model: Community, as: 'community' },
      { model: Course, as: 'course' }
    ]
  });
}

/**
 * Build system prompt for AI Teacher
 */
function buildTeacherSystemPrompt(aiTeacher, context = {}) {
  const { studentName, topic, postContext } = context;

  // Start with the teacher's defined system prompt
  let systemPrompt = aiTeacher.systemPrompt || getDefaultTeacherPrompt(aiTeacher);

  // Add curriculum context if available
  if (aiTeacher.curriculum) {
    const curriculum = aiTeacher.curriculum;

    if (curriculum.keyTopics?.length > 0) {
      systemPrompt += `\n\n## Key Topics You Teach:\n${curriculum.keyTopics.map(t => `- ${t}`).join('\n')}`;
    }

    if (curriculum.modules?.length > 0) {
      systemPrompt += `\n\n## Course Modules:\n${curriculum.modules.map((m, i) => `${i + 1}. ${m.title}: ${m.description || ''}`).join('\n')}`;
    }

    if (curriculum.resources?.length > 0) {
      systemPrompt += `\n\n## Reference Materials:\n${curriculum.resources.map(r => `- ${r}`).join('\n')}`;
    }
  }

  // Add personality traits
  if (aiTeacher.personality) {
    const p = aiTeacher.personality;
    systemPrompt += `\n\n## Your Teaching Style:
- Style: ${p.style || 'helpful'}
- Tone: ${p.tone || 'encouraging'}
- Language: ${p.language || 'multilingual'} (respond in the same language the student uses)`;
  }

  // Add student context
  if (studentName) {
    systemPrompt += `\n\nYou are currently helping a student named ${studentName}.`;
  }

  // Add post/discussion context
  if (postContext) {
    systemPrompt += `\n\n## Current Discussion Context:\nPost Title: ${postContext.title}\nPost Content: ${postContext.content}`;
  }

  // Add topic context
  if (topic) {
    systemPrompt += `\n\nThe student is asking about: ${topic}`;
  }

  return systemPrompt;
}

/**
 * Default teacher prompt
 */
function getDefaultTeacherPrompt(aiTeacher) {
  return `You are ${aiTeacher.name}, an AI Teacher at Haiti Skills Academy specializing in ${aiTeacher.expertise}.

Your Role:
- You are the teacher and owner of the "${aiTeacher.community?.name || 'your'}" community
- Help students understand ${aiTeacher.expertise} concepts
- Create engaging educational content
- Answer questions patiently and thoroughly
- Encourage students and celebrate their progress

Guidelines:
- Teach concepts step-by-step, building from basics
- Use practical examples relevant to Haiti when possible
- If asked about topics outside your expertise, politely redirect or acknowledge limitations
- Be encouraging but maintain educational standards
- Respond in the same language the student uses (Creole, French, or English)`;
}

/**
 * Generate AI response for community interaction
 * @param {number|string} aiTeacherId - AI Teacher ID or slug
 * @param {string} userMessage - The student's message/question
 * @param {Object} context - Additional context
 */
async function getTeacherResponse(aiTeacherId, userMessage, context = {}) {
  const aiTeacher = await getAITeacher(aiTeacherId);

  if (!aiTeacher) {
    return {
      success: false,
      content: "AI Teacher not found.",
      error: 'Teacher not found'
    };
  }

  if (!aiTeacher.isActive) {
    return {
      success: false,
      content: "This AI Teacher is currently unavailable.",
      error: 'Teacher inactive'
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      content: "AI service is not configured.",
      error: 'API key not configured'
    };
  }

  const systemPrompt = buildTeacherSystemPrompt(aiTeacher, context);
  const settings = aiTeacher.modelSettings || {};
  const model = settings.model || 'deepseek-chat';
  const temperature = settings.temperature ?? 0.7;
  const maxTokens = settings.maxTokens || 1500;

  // Build messages
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history if provided
  if (context.conversationHistory?.length > 0) {
    const recentHistory = context.conversationHistory.slice(-8);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.isFromAI ? 'assistant' : 'user',
        content: msg.content
      });
    }
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
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      return {
        success: false,
        content: "I'm having trouble connecting right now. Please try again.",
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return {
        success: false,
        content: "I couldn't generate a response. Please try again.",
        error: 'Empty response'
      };
    }

    // Increment response count
    await aiTeacher.increment('totalResponses');

    return {
      success: true,
      content: aiMessage,
      teacher: {
        id: aiTeacher.id,
        name: aiTeacher.name,
        avatar: aiTeacher.avatar,
        title: aiTeacher.title
      },
      metadata: {
        model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };

  } catch (err) {
    console.error('AI Teacher error:', err);
    return {
      success: false,
      content: "Something went wrong. Please try again later.",
      error: err.message
    };
  }
}

/**
 * Generate a lesson post from curriculum
 * @param {number} aiTeacherId - AI Teacher ID
 * @param {Object} options - Lesson options (topic, module, etc.)
 */
async function generateLessonPost(aiTeacherId, options = {}) {
  const aiTeacher = await getAITeacher(aiTeacherId);

  if (!aiTeacher || !aiTeacher.isActive) {
    return { success: false, error: 'Teacher not available' };
  }

  const { topic, moduleIndex, lessonType = 'lesson' } = options;

  // Get topic from curriculum if module index provided
  let lessonTopic = topic;
  if (!lessonTopic && moduleIndex !== undefined && aiTeacher.curriculum?.modules?.[moduleIndex]) {
    lessonTopic = aiTeacher.curriculum.modules[moduleIndex].title;
  }

  if (!lessonTopic) {
    return { success: false, error: 'No topic specified' };
  }

  const lessonPrompts = {
    lesson: `Create an educational lesson post about "${lessonTopic}". Include:
- A clear, engaging title
- Introduction to the topic
- Key concepts explained simply
- Practical examples (relevant to Haiti if possible)
- A summary of main points
- 2-3 discussion questions for students

Format as JSON: { "title": "...", "content": "..." }`,

    exercise: `Create a practice exercise about "${lessonTopic}". Include:
- A descriptive title
- Brief explanation of what students will practice
- 3-5 practice problems or tasks
- Tips for solving them
- Encourage students to share their answers in comments

Format as JSON: { "title": "...", "content": "..." }`,

    quiz: `Create a knowledge check quiz about "${lessonTopic}". Include:
- A title like "Quiz: ${lessonTopic}"
- 5 multiple choice questions
- Clear answer options (A, B, C, D)
- Note that answers will be discussed in comments

Format as JSON: { "title": "...", "content": "..." }`
  };

  const prompt = lessonPrompts[lessonType] || lessonPrompts.lesson;

  const systemPrompt = `You are ${aiTeacher.name}, creating educational content for your "${aiTeacher.community?.name}" community.
Your expertise: ${aiTeacher.expertise}
Always respond with valid JSON only, no other text.`;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: aiTeacher.modelSettings?.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      return { success: false, error: 'API error' };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse JSON from response
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const lesson = JSON.parse(jsonMatch[0]);
        await aiTeacher.increment('totalPosts');
        return {
          success: true,
          lesson: {
            title: lesson.title,
            content: lesson.content,
            type: lessonType === 'quiz' ? 'question' : lessonType === 'exercise' ? 'resource' : 'announcement',
            authorType: 'ai',
            aiTeacherId: aiTeacher.id
          }
        };
      }
    } catch (parseErr) {
      console.error('Failed to parse lesson JSON:', parseErr);
    }

    return { success: false, error: 'Failed to generate lesson format' };

  } catch (err) {
    console.error('Generate lesson error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate AI comment reply
 */
async function generateCommentReply(aiTeacherId, comment, postContext) {
  return await getTeacherResponse(aiTeacherId, comment.content, {
    studentName: comment.author?.name,
    postContext: {
      title: postContext.title,
      content: postContext.content
    }
  });
}

/**
 * Check if a community is AI-owned
 */
async function isAICommunity(communityId) {
  const { Community } = require('../models');
  const community = await Community.findByPk(communityId);
  return community?.isAIOwned === true;
}

/**
 * Get AI Teacher for a community
 */
async function getTeacherForCommunity(communityId) {
  const { Community, AICommunityTeacher } = require('../models');
  const community = await Community.findByPk(communityId, {
    include: [{ model: AICommunityTeacher, as: 'aiTeacher' }]
  });
  return community?.aiTeacher;
}

module.exports = {
  getAITeacher,
  getTeacherResponse,
  generateLessonPost,
  generateCommentReply,
  isAICommunity,
  getTeacherForCommunity,
  buildTeacherSystemPrompt
};
