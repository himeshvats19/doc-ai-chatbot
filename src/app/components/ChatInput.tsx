'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
}

export default function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend(input);
      }
    }
  };

  const handleSendClick = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
    }
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask a question about your documents..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          id="chat-input"
        />
        <button
          type="button"
          className="send-button"
          disabled={!input.trim() || isLoading}
          onClick={handleSendClick}
          id="send-button"
          aria-label="Send message"
        >
          {isLoading ? '⏳' : '↑'}
        </button>
      </div>
      <div className="input-hint">
        Press Enter to send · Shift + Enter for new line
      </div>
    </div>
  );
}
