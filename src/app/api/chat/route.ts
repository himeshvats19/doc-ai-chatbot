import { streamText, createUIMessageStreamResponse, createUIMessageStream } from 'ai';
import { openai } from '@ai-sdk/openai';
import { embedQuery } from '@/lib/embeddings';
import { vectorStore } from '@/lib/vector-store';
import { ingestDocuments, getConfig } from '@/lib/ingest';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const folderFilter = new URL(req.url).searchParams.get('folder');

    // Auto-load on cold start: try pre-built cache first, fall back to full ingestion
    if (!vectorStore.isReady()) {
      const loaded = vectorStore.loadFromCache();
      if (!loaded) {
        console.log('Vector store empty and no cache found — running full ingestion...');
        await ingestDocuments();
      }
    }

    // Convert UIMessages to CoreMessages format
    const coreMessages = messages.map((m: any) => {
      let content = typeof m.content === 'string' ? m.content : '';
      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      } else if (Array.isArray(m.content)) {
        content = m.content
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      }
      return { role: m.role, content };
    });

    // Get the latest user message from the converted array
    const lastUserMessage = [...coreMessages].reverse().find(
      (m: { role: string }) => m.role === 'user'
    );

    if (!lastUserMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Extract text content from the message
    const userText = lastUserMessage.content;

    const config = getConfig();

    // Embed the user's query
    const queryEmbedding = await embedQuery(
      userText,
      config.settings.embeddingModel
    );

    // Search for relevant chunks naturally scoped to the user's active folder path
    const results = vectorStore.search(
      queryEmbedding,
      config.settings.topK,
      folderFilter
    );

    // Build context from retrieved chunks
    const context = results
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.chunk.metadata.sourceTitle} — ${r.chunk.metadata.sectionTitle}]\n${r.chunk.content}`
      )
      .join('\n\n---\n\n');

    // Build source citation info
    const sources = results.map((r) => ({
      title: r.chunk.metadata.sourceTitle,
      section: r.chunk.metadata.sectionTitle,
      score: Math.round(r.score * 100) / 100,
    }));

    const systemPrompt = `You are a knowledgeable assistant that answers questions based ONLY on the provided documentation context. 

RULES:
1. Only answer questions using the context provided below. Do not use any external knowledge.
2. If the context does not contain enough information to answer the question, say: "I don't have enough information about that in my knowledge base. Could you please rephrase your question or provide more details?"
3. Be concise, accurate, and helpful.
4. Format your responses with markdown when appropriate (lists, code blocks, etc.).
   ---


CONTEXT FROM KNOWLEDGE BASE:
${context || 'No relevant documents found.'}`;

    const result = streamText({
      model: openai('gpt-5.4-mini'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
