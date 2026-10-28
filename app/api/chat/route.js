import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, smoothStream } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, conversationId, attachment } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  console.log('=== DEBUG ===');
  console.log('conversationId:', conversationId);
  console.log('attachment:', attachment);

  // ============ AMBIL ATTACHMENT DARI BODY ============
  let filePart = null;
  if (attachment) {
    const { data: fileData, error } = await supabase.storage
      .from('chat-attachments')
      .download(attachment);

    if (error) {
      console.error('Gagal unduh file:', error);
    } else if (fileData) {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const ext = attachment.split('.').pop().toLowerCase();
      const mediaType = fileData.type || MIME_MAP[ext] || 'image/jpeg';

      filePart = {
        type: 'file',
        data: buffer,
        mediaType,
      };

      console.log('File diunduh:', {
        path: attachment,
        mediaType,
        size: buffer.length,
      });
    }
  } else {
    console.log('Tidak ada attachment');
  }

  if (filePart && modelMessages.length > 0) {
    const lastMsg = modelMessages[modelMessages.length - 1];
    if (Array.isArray(lastMsg.content)) {
      lastMsg.content.push(filePart);
    } else {
      lastMsg.content = [lastMsg.content, filePart];
    }
    console.log('FilePart disisipkan. Content length:', lastMsg.content.length);
  }
  // ====================================================

  // ============ SIMPAN PESAN USER ============
  const lastUserMessage = messages[messages.length - 1];
  if (conversationId && lastUserMessage) {
    const textPart = lastUserMessage.parts?.find((p) => p.type === 'text');
    if (textPart) {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: textPart.text,
      });
      if (error) console.error('Gagal simpan pesan user:', error);
    }
  }
  // ==========================================

  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log('Mencoba model:', modelName);

      const result = streamText({
        model: google(modelName),
        system:
          'Kamu adalah Asyam AI, asisten virtual yang ramah dan membantu. ' +
          'Selalu jawab dalam bahasa yang sama dengan yang dipakai pengguna. ' +
          'Jika pengguna mengirim gambar atau file, analisis isinya dengan teliti dan sebutkan apa yang benar-benar terlihat. ' +
          'Jangan gunakan format markdown seperti **, *, #, _, atau tanda lainnya. ' +
          'Tulis jawaban dalam teks polos yang rapi. ' +
          'Langsung ke inti, jangan bertele-tele, maksimal 3 paragraf.',
        messages: modelMessages,
        reasoning: 'low',
        maxOutputTokens: 500,
        maxRetries: 0,
        experimental_transform: smoothStream({
          delayInMs: 10,
          chunking: 'word',
        }),
        onFinish: async ({ text }) => {
          if (conversationId && text) {
            const { error } = await supabase.from('messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: text,
            });
            if (error) console.error('Gagal simpan balasan AI:', error);
          }
        },
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      const is503 =
        error?.statusCode === 503 ||
        error?.lastError?.statusCode === 503 ||
        error?.message?.includes('high demand') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.lastError?.message?.includes('high demand');

      const is429 =
        error?.statusCode === 429 ||
        error?.lastError?.statusCode === 429 ||
        error?.message?.includes('quota') ||
        error?.lastError?.message?.includes('quota');

      if (is503 || is429) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  return new Response(
    JSON.stringify({
      error: 'Kuota AI habis atau semua model sedang sibuk. Coba lagi nanti ya.',
      detail: lastError?.message,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}