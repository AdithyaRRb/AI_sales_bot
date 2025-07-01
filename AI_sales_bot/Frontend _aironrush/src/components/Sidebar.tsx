import React, { useState } from 'react';
import { Plus, RefreshCw, MessageSquare, Clock, User, FileText, ChevronDown, ChevronUp, BarChart3, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Session, UserInfo, FileSummaryRecord } from '../types/chatTypes';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onCreateSession: (title?: string) => void;
  onLoadSession: (sessionId: string) => void;
  onRefreshSessions: () => void;
  userInfo: UserInfo | null;
  summaries: FileSummaryRecord[];
  showSummaries: boolean;
  onToggleSummaries: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onCreateSession,
  onLoadSession,
  onRefreshSessions,
  userInfo,
  summaries,
  showSummaries,
  onToggleSummaries
}) => {
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateSession = async () => {
    setIsCreating(true);
    await onCreateSession(newSessionTitle || undefined);
    setNewSessionTitle('');
    setIsCreating(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace('Z', '+00:00'));
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown';
    }
  };

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
    <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Sessions</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshSessions}
            className="hover:bg-orange-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* New Session Creation */}
        <div className="space-y-3">
          <Input
            placeholder="Session title (optional)"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            className="text-sm"
          />
          <Button 
            onClick={handleCreateSession}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Session'}
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs">Create your first session to get started</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.session_id === currentSessionId;
              return (
                <div
                  key={session.session_id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 shadow-sm' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  onClick={() => onLoadSession(session.session_id)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-500' : 'bg-slate-300'}`} />
                    <h3 className="font-medium text-sm text-slate-800 truncate">
                      {session.title || 'Untitled Session'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Analytics Dashboard Link */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
            onClick={() => navigate('/analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="text-sm">Analytics Dashboard</span>
          </Button>
        </div>

        {/* Sales Buddy Link */}
        <div className="mt-3">
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
            onClick={() => navigate('/sales-buddy')}
          >
            <Building2 className="w-4 h-4 mr-2" />
            <span className="text-sm">Sales Buddy</span>
          </Button>
        </div>

        {/* Summary History Section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div 
            className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={onToggleSummaries}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="font-medium text-sm text-slate-800">File Summaries</h3>
              <Badge variant="secondary" className="text-xs">
                {summaries.length}
              </Badge>
            </div>
            {showSummaries ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>

          {showSummaries && (
            <div className="mt-3 space-y-2">
              {summaries.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No summaries yet</p>
                  <p className="text-xs">Upload files in chat to generate summaries</p>
                </div>
              ) : (
                summaries.slice(0, 5).map((summary, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-xs text-slate-800 truncate">
                        {summary.file_name}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatDate(summary.created_at)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div>
                        <span className="text-xs text-slate-500">Client:</span>
                        <p className="text-xs font-medium">{summary.summary.client_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Region:</span>
                        <p className="text-xs font-medium">{summary.summary.client_region}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mb-1">
                      <Badge className={`text-xs ${getFeedbackColor(summary.summary.feedback)}`}>
                        {summary.summary.feedback}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(summary.summary.project_status)}`}>
                        {summary.summary.project_status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {summary.summary.input_summary}
                    </p>
                  </div>
                ))
              )}
              
              {summaries.length > 5 && (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500">
                    +{summaries.length - 5} more summaries
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Info */}
      {userInfo && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{userInfo.name}</p>
              <p className="text-xs text-slate-500 truncate">{userInfo.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
