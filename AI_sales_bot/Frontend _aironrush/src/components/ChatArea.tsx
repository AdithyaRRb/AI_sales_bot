import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Loader2, Zap, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Message, FileSummary } from '../types/chatTypes';
import { MessageBubble } from './MessageBubble';
import { FileUploadArea } from './FileUploadArea';

interface FileSummaryDisplayProps {
  summary: FileSummary;
  fileName: string;
}

const FileSummaryDisplay: React.FC<FileSummaryDisplayProps> = ({ summary, fileName }) => {
  const getFeedbackColor = (feedback: string) => {
    switch (feedback.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-going': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-blue-800">File Summary Generated</h4>
        <span className="text-sm text-blue-600">({fileName})</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-blue-600">User Name</label>
          <p className="text-sm font-medium">{summary.user_name}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-blue-600">Client Name</label>
          <p className="text-sm font-medium">{summary.client_name}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-blue-600">Region</label>
          <p className="text-sm font-medium">{summary.client_region}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-blue-600">Vertical</label>
          <p className="text-sm font-medium">{summary.vertical}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mb-3">
        <Badge className={getFeedbackColor(summary.feedback)}>
          {summary.feedback}
        </Badge>
        <Badge className={getStatusColor(summary.project_status)}>
          {summary.project_status}
        </Badge>
      </div>
      
      <div>
        <label className="text-xs font-medium text-blue-600">Summary</label>
        <p className="text-sm text-blue-700 mt-1">{summary.input_summary}</p>
      </div>
    </div>
  );
};

interface ChatAreaProps {
  messages: Message[];
  currentSessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  onSendMessage: (content: string, file?: File) => void;
  onStreamMessage: (content: string, file?: File) => void;
  onSummarizeFile: (file: File) => void;
  apiOnline: boolean;
  suggestions?: string[];
  lastFileSummary?: { summary: FileSummary; fileName: string } | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentSessionId,
  isLoading,
  isStreaming,
  onSendMessage,
  onStreamMessage,
  onSummarizeFile,
  apiOnline,
  suggestions,
  lastFileSummary
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim() || !apiOnline) return;
    
    onSendMessage(inputMessage, uploadedFile || undefined);
    setInputMessage('');
    setUploadedFile(null);
  };

  const handleStream = () => {
    if (!inputMessage.trim() || !apiOnline) return;
    
    onStreamMessage(inputMessage, uploadedFile || undefined);
    setInputMessage('');
    setUploadedFile(null);
  };

  const handleSummarizeFile = () => {
    if (!uploadedFile || !apiOnline) return;
    
    onSummarizeFile(uploadedFile);
    setUploadedFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        {!currentSessionId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4 animate-bounce">🚀</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Welcome to AIron Rush
            </h2>
            <p className="text-slate-500 mb-8 text-lg">Your AI-Powered Chat</p>
            
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">💡 Try these suggestions:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions?.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-white rounded-lg border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer text-sm text-slate-600 hover:bg-orange-50"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-pulse">🚀</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Start a conversation with AIron Rush</h3>
                <p className="text-slate-500">Type a message below to get started!</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            
            {/* Display file summary if available */}
            {lastFileSummary && (
              <FileSummaryDisplay 
                summary={lastFileSummary.summary} 
                fileName={lastFileSummary.fileName} 
              />
            )}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-slate-200">
        {/* File Upload */}
        <FileUploadArea 
          uploadedFile={uploadedFile}
          onFileUpload={setUploadedFile}
          onFileRemove={() => setUploadedFile(null)}
        />
        
        {/* Message Input */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !apiOnline 
                  ? "API is offline. Please check the connection." 
                  : !currentSessionId 
                    ? "Create a session to start chatting..."
                    : "Type your message here... (Enter to send, Shift+Enter for new line)"
              }
              disabled={!apiOnline || !currentSessionId || isLoading || isStreaming}
              className="min-h-[60px] resize-none pr-12 text-sm"
            />
            {uploadedFile && (
              <div className="absolute top-2 right-2">
                <Upload className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || !apiOnline || !currentSessionId || isLoading || isStreaming}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={handleStream}
              disabled={!inputMessage.trim() || !apiOnline || !currentSessionId || isLoading || isStreaming}
              variant="outline"
              className="hover:bg-blue-50"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* File Summarize Button - Only show when file is uploaded */}
        {uploadedFile && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">{uploadedFile.name}</span>
                <span className="text-xs text-blue-600">
                  ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                onClick={handleSummarizeFile}
                disabled={!apiOnline || !currentSessionId || isLoading || isStreaming}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for Summarizing"}
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>
            {!apiOnline && "⚠️ API Offline"} 
            {apiOnline && !currentSessionId && "ℹ️ No active session"}
            {apiOnline && currentSessionId && "✓ Ready to chat"}
          </span>
          <span>{inputMessage.length}/2000</span>
        </div>
      </div>
    </div>
  );
};
