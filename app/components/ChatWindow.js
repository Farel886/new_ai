'use client';

import { useChat } from '@ai-sdk/react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatWindow({ conversationId }) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    body: { conversationId },
  });

  return (
    <div className="w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-lg flex flex-col">
      <header className="p-4 border-b font-semibold flex justify-between items-center">
        <span>Chatbot Gemini</span>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-red-500">Logout</button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
      </div>

      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        loading={status === 'streaming' || status === 'submitted'}
      />
    </div>
  );
}