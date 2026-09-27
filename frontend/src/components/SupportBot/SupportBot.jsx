import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, RotateCcw, ChevronDown } from 'lucide-react';
import { supportService } from '../../services/support/support.service.js';
import styles from './SupportBot.module.css';

/**
 * SupportBot — floating chat widget (bottom-right FAB).
 * Opens a premium glassmorphic chat window powered by Gemini.
 */
export default function SupportBot() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [faqs, setFaqs]           = useState([]);
  const [pulse, setPulse]         = useState(false);
  const messagesEndRef            = useRef(null);
  const inputRef                  = useRef(null);

  // Fetch FAQs on mount
  useEffect(() => {
    supportService.getFaqs()
      .then(data => setFaqs(data.faqs || []))
      .catch(() => {});

    // Pulse FAB after 3s to attract attention
    const t = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await supportService.chat({
        message: trimmed,
        messages: messages.slice(-10),
      });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply, id: Date.now() + 1 },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I ran into an issue. Please try again.',
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className={styles.window} role='dialog' aria-label='ForumStudy Support Chat'>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.botAvatar}>
                <Bot size={18} />
              </div>
              <div>
                <p className={styles.botName}>ForumStudy Assistant</p>
                <p className={styles.botStatus}>
                  <span className={styles.statusDot} />
                  Online
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type='button'
                className={styles.headerBtn}
                onClick={clearChat}
                aria-label='Clear chat'
                title='Clear chat'
              >
                <RotateCcw size={15} />
              </button>
              <button
                type='button'
                className={styles.headerBtn}
                onClick={() => setOpen(false)}
                aria-label='Close chat'
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}><Bot size={32} /></div>
                <p className={styles.welcomeTitle}>Hi! I'm your ForumStudy Assistant 👋</p>
                <p className={styles.welcomeSub}>Ask me anything about the platform or studying!</p>
                {faqs.length > 0 && (
                  <div className={styles.faqs}>
                    {faqs.slice(0, 4).map((q, i) => (
                      <button
                        key={i}
                        type='button'
                        className={styles.faqBtn}
                        onClick={() => sendMessage(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message bubbles */}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.bubble} ${
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles.bubbleBotAvatar}><Bot size={14} /></div>
                )}
                <p className={styles.bubbleText}>{msg.content}</p>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                <div className={styles.bubbleBotAvatar}><Bot size={14} /></div>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            className={styles.inputRow}
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
          >
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type your message…'
              rows={1}
              maxLength={600}
              aria-label='Chat message'
            />
            <button
              type='submit'
              className={styles.sendBtn}
              disabled={!input.trim() || loading}
              aria-label='Send message'
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        type='button'
        className={`${styles.fab} ${open ? styles.fabOpen : ''} ${pulse && !open ? styles.fabPulse : ''}`}
        onClick={() => { setOpen(o => !o); setPulse(false); }}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        title='ForumStudy Support'
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && (
          <span className={styles.fabLabel}>Support</span>
        )}
      </button>
    </>
  );
}
