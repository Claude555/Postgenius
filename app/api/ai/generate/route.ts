import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateContent, improveContent, generateHashtags } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, topic, tone, platform, content } = await request.json();

    let result = '';

    switch (type) {
      case 'generate':
        result = await generateContent({ topic, tone, platform });
        break;
      case 'improve':
        result = await improveContent(content, platform);
        break;
      case 'hashtags':
        result = await generateHashtags(content);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ content: result });
  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}