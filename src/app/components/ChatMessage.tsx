'use client';

import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isLoading,
}: ChatMessageProps) {
  return (
    <div className={`message message--${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-body">
        <div className="message-content">
          {isLoading && !content ? (
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : role === 'assistant' ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p>{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
