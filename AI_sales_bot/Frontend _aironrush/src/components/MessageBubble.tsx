import React from 'react';
import { User, Bot, Clock } from 'lucide-react';
import { Message } from '../types/chatTypes';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.message_type === 'user';
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
            : 'bg-gradient-to-r from-green-500 to-teal-500'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`${isUser ? 'mr-2' : 'ml-2'}`}>
          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-sm' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
          }`}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`flex items-center space-x-1 mt-1 text-xs text-slate-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
