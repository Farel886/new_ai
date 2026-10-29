'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { createClient } from '@/lib/supabase/client';

function CrownLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 17L5 7L9 11L12 5L15 11L19 7L21 17H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [initialMessages, setInitialMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function initConversation() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let convId;
      if (convs && convs.length > 0) {
        convId = convs[0].id;
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        convId = newConv.id;
      }

      setConversationId(convId);
      setLoadingConv(false);

      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?conversationId=${convId}`);
        const data = await res.json();
        if (data.messages) {
          const formatted = data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
            createdAt: m.created_at,
          }));
          setInitialMessages(formatted);
        }
      } catch (err) {
        console.error('Gagal load pesan:', err);
      } finally {
        setLoadingMessages(false);
      }
    }

    initConversation();
  }, [supabase]);

  const { messages, status, sendMessage } = useChat({
    id: conversationId,
    initialMessages,
  });

  const lastMessage = messages.at(-1);
  const isAssistantThinking =
    status === 'streaming' &&
    lastMessage?.role === 'assistant' &&
    (lastMessage?.parts?.length ?? 0) === 0;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  async function uploadFile(file) {
    setUploading(true);
    try {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal dapat signed URL');
      const { signedUrl, path } = data;
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Upload ke storage gagal');
      setPendingFile({ path, name: file.name, type: file.type });
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() && !pendingFile) return;
    sendMessage(
      { text: input || ' ' },
      { body: { conversationId, attachment: pendingFile?.path || null } }
    );
    setInput('');
    setPendingFile(null);
  }

  function formatTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loadingConv) {
    return (
      <main className="h-dvh flex items-center justify-center bg-neutral-950">
        <div className="flex items-center gap-3 text-neutral-500 text-sm">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Menyiapkan chat...
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh w-full bg-neutral-950 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex justify-between items-center bg-neutral-950">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center">
              <CrownLogo className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-neutral-950 rounded-full" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm tracking-tight">Asyam AI</h1>
            <p className="text-[10px] sm:text-xs text-neutral-500">
              {isAssistantThinking ? 'Sedang mengetik...' : 'Online'}
            </p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-xs text-neutral-500 hover:text-red-400 transition px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {loadingMessages && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 mb-6 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center">
                <CrownLogo className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="font-semibold text-white text-lg mb-1.5 tracking-tight">Halo, aku Asyam AI</h2>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                Tanya apa saja. Aku siap membantu dengan jawaban yang jelas dan ringkas.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-900 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CrownLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
              )}

              <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-400 text-neutral-950 rounded-br-md font-medium'
                      : 'bg-neutral-900 border border-white/5 text-neutral-200 rounded-bl-md'
                  }`}
                >
                  {Array.isArray(m.parts) &&
                    m.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return <span key={index}>{stripMarkdown(part.text)}</span>;
                      }
                      return null;
                    })}
                </div>
                <span className="text-[9px] sm:text-[10px] text-neutral-600 mt-1 px-1">
                  {formatTime(m.createdAt)}
                </span>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 border border-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isAssistantThinking && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-900 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CrownLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              </div>
              <div className="bg-neutral-900 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {pendingFile && (
        <div className="flex-shrink-0 px-3 sm:px-4">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-400">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="ml-auto text-neutral-500 hover:text-red-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 sm:p-4 border-t border-white/5 bg-neutral-950">
        <div className="max-w-3xl mx-auto w-full flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-neutral-500 hover:text-emerald-400 p-2.5 transition flex-shrink-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kirim pesan ke Asyam AI..."
            className="flex-1 bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
          />
          <button
            type="submit"
            disabled={isAssistantThinking || (!input.trim() && !pendingFile)}
            className="bg-emerald-400 hover:bg-emerald-300 text-neutral-950 w-11 h-11 rounded-2xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isAssistantThinking ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}