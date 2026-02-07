import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateContent(params: {
  topic?: string;
  tone?: 'professional' | 'casual' | 'funny' | 'inspiring';
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  includeHashtags?: boolean;
}) {
  const { topic, tone = 'professional', platform = 'twitter', includeHashtags = true } = params;

  const platformGuidelines = {
    twitter: 'Keep it under 280 characters, engaging and concise',
    linkedin: 'Professional, 1-2 paragraphs, value-driven content',
    facebook: 'Conversational, 2-3 paragraphs, community-focused',
    instagram: 'Visual-focused, emoji-rich, lifestyle content',
  };

  const prompt = `Create a ${tone} social media post for ${platform}.
${topic ? `Topic: ${topic}` : 'Create an engaging post about innovation and technology.'}

Guidelines:
- ${platformGuidelines[platform]}
- Use emojis where appropriate
${includeHashtags ? '- Include 3-5 relevant hashtags at the end' : '- No hashtags'}
- Make it engaging and shareable

Generate only the post content, nothing else.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional social media content creator. Create engaging, authentic content.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return completion.choices[0].message.content || '';
}

export async function improveContent(content: string, platform: string) {
  const prompt = `Improve this social media post for ${platform}:

"${content}"

Make it more engaging while keeping the core message. Add relevant emojis and improve the flow.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a social media expert. Improve posts while maintaining authenticity.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content || '';
}

export async function generateHashtags(content: string) {
  const prompt = `Generate 5-8 relevant hashtags for this social media post:

"${content}"

Return only hashtags separated by spaces, like: #Marketing #SocialMedia #Content`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 100,
  });

  return completion.choices[0].message.content || '';
}