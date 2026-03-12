'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAppContext } from '@/lib/context';
import Image from 'next/image';

export default function ChatPage() {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        setMessages(data.messages || []);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    fetchMessages();

    const newSocket = io();
    socketRef.current = newSocket;

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview) || !user) return;

    const messageData = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: newMessage.trim(),
      imageUrl: imagePreview,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    scrollToBottom();

    // Emit to others
    socketRef.current?.emit('send_message', messageData);

    // Save to DB
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Team Chat</h1>
        <p className="text-zinc-400 mt-1">Collaborate and share updates in real-time</p>
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${isMe ? 'ml-3' : 'mr-3'}`}>
                    {showAvatar ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        <Image src={msg.senderAvatar || `https://i.pravatar.cc/150?u=${msg.senderId}`} alt={msg.senderName} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <span className="text-xs text-zinc-500 mb-1 ml-1">{msg.senderName}</span>
                    )}
                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tr-sm' : 'bg-white/5 text-zinc-200 border border-white/10 rounded-tl-sm'}`}>
                      {msg.imageUrl && (
                        <div className="mb-2 relative rounded-lg overflow-hidden border border-white/10 max-w-sm">
                          <Image src={msg.imageUrl} alt="Uploaded" width={400} height={300} className="w-full h-auto object-cover" />
                        </div>
                      )}
                      {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                <Image src={imagePreview} alt="Preview" width={96} height={96} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => {
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none max-h-32 min-h-[48px]"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={(!newMessage.trim() && !imagePreview) || !user}
              className="p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
