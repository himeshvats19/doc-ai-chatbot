'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ReactMarkdown from 'react-markdown';
import { DefaultChatTransport } from 'ai';

interface BlogInterfaceProps {
  markdown: string;
  folder: string;
  title: string;
}

export default function BlogInterface({ markdown, folder, title }: BlogInterfaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: folder ? `/api/chat?folder=${folder}` : '/api/chat',
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setInput('');
      await sendMessage({ text: text.trim() });
    },
    [isLoading, sendMessage]
  );

  const getMessageContent = (message: typeof messages[0]): string => {
    if (!message.parts) return '';
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('');
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={`blog-interface ${isChatOpen ? 'split-active' : ''}`}>
      {/* LEFT PANE - BLOG READER */}
      <div className="blog-pane">
        <div className="blog-reader-container">
          {/* Custom Super Premium Hero Block */}
          <div className="blog-hero">
            <div className="blog-hero-image" style={{ backgroundImage: "url('/hero.png')" }}></div>
            <div className="blog-hero-meta">
              <div className="tag">ARCHITECTURE</div>
              <div className="date">April 18, 2026</div>
            </div>
            <h1 className="blog-hero-title">{title}</h1>
            <div className="blog-hero-author">
              <div 
                className="avatar" 
                style={{ 
                  backgroundImage: "url('/avatar.jpg')", 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  color: 'transparent'
                }}
              >
                HV
              </div>
              <div className="author-details">
                <div className="author-name">Himesh Vats</div>
                <div className="author-role">Staff Frontend Engineer</div>
              </div>
              <div className="read-time">12 min read</div>
            </div>
          </div>

          <div className="blog-reader-content markdown-body">
            <ReactMarkdown components={{ h1: () => null }}>
              {markdown || '# Article Not Found\nWe could not locate the markdown file for this article.'}
            </ReactMarkdown>
          </div>
        </div>

        {/* Floating Action Button */}
        {!isChatOpen && (
          <button className="fab-ai-toggle" onClick={() => setIsChatOpen(true)}>
            ✨ Ask AI about this post
          </button>
        )}
      </div>

      {/* RIGHT PANE - AI CHAT */}
      {isChatOpen && (
        <div className="chat-pane">
          <header className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="header-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }}>✨</div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>ByteChat Assistant</span>
            </div>
            <button className="close-chat-btn" onClick={() => setIsChatOpen(false)}>×</button>
          </header>

          <div className="messages-container">
            {!hasMessages && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '20px' }}>
                How can I help you understand this article?
              </div>
            )}
            {messages.map((message) => {
              const content = getMessageContent(message);
              return (
                <ChatMessage
                  key={message.id}
                  role={message.role as 'user' | 'assistant'}
                  content={content}
                  isLoading={isLoading && message.role === 'assistant' && !content}
                />
              );
            })}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <ChatMessage role="assistant" content="" isLoading={true} />
            )}
            {error && (
              <div className="message message--assistant">
                <div className="message-avatar">⚠️</div>
                <div className="message-body">
                  <div className="message-content" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ color: 'var(--text-primary)' }}>{error.message || 'An error occurred connecting to the AI.'}</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSend={handleSend}
          />
        </div>
      )}
    </div>
  );
}
