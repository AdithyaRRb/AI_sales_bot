import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { SettingsPanel } from '../components/SettingsPanel';
import { ApiService } from '../utils/apiService';
import { Message, Session, UserInfo, FileSummary, FileSummaryRecord } from '../types/chatTypes';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [lastFileSummary, setLastFileSummary] = useState<{ summary: FileSummary; fileName: string } | null>(null);
  const [summaries, setSummaries] = useState<FileSummaryRecord[]>([]);
  const [showSummaries, setShowSummaries] = useState(false);

  const suggestions = [
    "Please analyze this document and provide a summary",
    "What are the key insights from this file?",  
    "Extract the main points from this document",
    "Summarize the content and identify key stakeholders",
    "Analyze this file and provide business insights"
  ];

  // Initialize user info
  useEffect(() => {
    // Try to get existing user ID from localStorage
    const existingUserId = localStorage.getItem('chat_user_id');
    
    const defaultUser: UserInfo = {
      cognitoId: existingUserId || `user_${Math.random().toString(36).substr(2, 8)}`,
      name: "Streamlit User",
      userName: "streamlit_user",
      userEmail: "user@streamlit.com",
      role: "tester"
    };
    
    // Store the user ID in localStorage for analytics dashboard
    localStorage.setItem('chat_user_id', defaultUser.cognitoId);
    
    setUserInfo(defaultUser);
    console.log('🔧 User initialized with ID:', defaultUser.cognitoId);
  }, []);

  // Check API health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isOnline = await ApiService.checkHealth();
        setApiOnline(isOnline);
      } catch (error) {
        setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load user sessions
  useEffect(() => {
    if (userInfo) {
      loadSessions();
      loadSummaries();
    }
  }, [userInfo]);

  const loadSessions = async () => {
    if (!userInfo) return;
    
    try {
      const userSessions = await ApiService.getUserSessions(userInfo.cognitoId);
      setSessions(userSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      });
    }
  };

  const loadSummaries = async () => {
    if (!userInfo) return;
    
    try {
      const userSummaries = await ApiService.getUserSummaries(userInfo.cognitoId);
      setSummaries(userSummaries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load summaries",
        variant: "destructive"
      });
    }
  };

  const createSession = async (title?: string) => {
    if (!userInfo) {
      console.error("No userInfo available for session creation");
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive"
      });
      return;
    }

    console.log("Creating session with userInfo:", userInfo);
    console.log("Session title:", title);

    try {
      const sessionData = await ApiService.createSession(userInfo, title);
      console.log("Session created successfully:", sessionData);
      
      if (sessionData) {
        setCurrentSessionId(sessionData.session_id);
        setMessages([]);
        await loadSessions();
        toast({
          title: "Success",
          description: `New session created: ${sessionData.title}`
        });
      }
    } catch (error) {
      console.error("Session creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const history = await ApiService.getSessionHistory(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(history);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load session",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (content: string, file?: File) => {
    if (!currentSessionId || !userInfo) {
      toast({
        title: "Error",
        description: "No active session. Please create a session first.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      message_type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setLastFileSummary(null); // Clear previous file summary

    try {
      const response = await ApiService.sendMessage(
        currentSessionId,
        userInfo.cognitoId,
        content,
        selectedModel,
        file // Pass file for context but don't auto-summarize
      );

      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          message_type: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Only handle file summary if it was explicitly requested
        if (response.file_summary && file) {
          setLastFileSummary({
            summary: response.file_summary,
            fileName: file.name
          });
          // Reload summaries to include the new one
          await loadSummaries();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const streamMessage = async (content: string, file?: File) => {
    if (!currentSessionId || !userInfo) {
      toast({
        title: "Error",
        description: "No active session. Please create a session first.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      message_type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setLastFileSummary(null); // Clear previous file summary

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      message_type: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      await ApiService.streamMessage(
        currentSessionId,
        userInfo.cognitoId,
        content,
        selectedModel,
        file, // Pass file for context but don't auto-summarize
        (chunk) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        (fileSummary) => {
          // Only handle file summary if it was explicitly requested
          if (fileSummary && file) {
            setLastFileSummary({
              summary: fileSummary,
              fileName: file.name
            });
          }
        }
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stream message",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastFileSummary(null);
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared"
    });
  };

  const exportChat = () => {
    const chatText = messages
      .map(msg => `${msg.message_type.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Chat exported successfully"
    });
  };

  const toggleSummaries = () => {
    setShowSummaries(!showSummaries);
  };

  const handleSummarizeFile = async (file: File) => {
    if (!userInfo) {
      toast({
        title: "Error",
        description: "User not initialized",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await ApiService.summarizeFile(userInfo.cognitoId, file);
      
      if (result.summary) {
        setLastFileSummary({
          summary: result.summary,
          fileName: file.name
        });
        await loadSummaries(); // Refresh the summaries list
        toast({
          title: "Success",
          description: "File summarized successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to summarize file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onCreateSession={createSession}
        onLoadSession={loadSession}
        onRefreshSessions={loadSessions}
        userInfo={userInfo}
        summaries={summaries}
        showSummaries={showSummaries}
        onToggleSummaries={toggleSummaries}
      />
      <div className="flex-1 flex flex-col">
        <SettingsPanel
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          apiOnline={apiOnline}
          onClearChat={clearChat}
          onExportChat={exportChat}
        />
        <ChatArea
          messages={messages}
          currentSessionId={currentSessionId}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
          onStreamMessage={streamMessage}
          onSummarizeFile={handleSummarizeFile}
          apiOnline={apiOnline}
          suggestions={suggestions}
          lastFileSummary={lastFileSummary}
        />
      </div>
    </div>
  );
};

export default Index;
