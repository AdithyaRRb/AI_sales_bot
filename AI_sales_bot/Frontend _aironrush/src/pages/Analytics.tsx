import React, { useState, useEffect, useRef } from 'react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ApiService } from '../utils/apiService';
import { FileSummaryRecord } from '../types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileText, RefreshCw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const [summaries, setSummaries] = useState<FileSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDataCount, setLastDataCount] = useState(0);
  const navigate = useNavigate();
  
  // Use the same user ID generation logic as the main chat interface
  const [defaultUserId] = useState(() => {
    // First try to get from localStorage (if set by main chat)
    const stored = localStorage.getItem('chat_user_id');
    if (stored) return stored;
    
    // If not found, generate a new one and store it
    const newId = `user_${Math.random().toString(36).substr(2, 8)}`;
    localStorage.setItem('chat_user_id', newId);
    return newId;
  });

  const loadSummaries = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      console.log('🔍 Fetching summaries for user:', defaultUserId);
      
      const response = await ApiService.getUserSummaries(defaultUserId);
      console.log('📊 Raw API response:', response);
      
      // The API returns an array directly, not wrapped in an object
      if (Array.isArray(response)) {
        console.log('✅ Found', response.length, 'summaries');
        if (response.length > 0) {
          console.log('📋 Sample summary data:', response[0]);
          console.log('📋 JSON structure:', JSON.stringify(response[0], null, 2));
        }
        
        // Check if new data was added
        if (response.length > lastDataCount && lastDataCount > 0) {
          const newCount = response.length - lastDataCount;
          toast({
            title: "New Data Available! 🎉",
            description: `${newCount} new file summary${newCount > 1 ? 'ies' : 'y'} added to analytics`,
          });
        }
        
        setSummaries(response);
        setLastDataCount(response.length);
        
        if (response.length > 0 && showLoading) {
          toast({
            title: "Data Loaded",
            description: `Successfully loaded ${response.length} file summaries for user ${defaultUserId}`,
          });
        }
      } else {
        console.log('⚠️ Response is not an array:', response);
        setSummaries([]);
        setLastDataCount(0);
      }
    } catch (error) {
      console.error('❌ Error loading summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadSummaries();
  }, []);

  // Auto-refresh data every 30 seconds to get latest summaries
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing analytics data...');
      loadSummaries(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [lastDataCount]);

  const handleRefresh = () => {
    loadSummaries(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics dashboard...</p>
          <p className="text-sm text-slate-500 mt-2">Fetching JSON data from database</p>
          <p className="text-xs text-slate-400 mt-1">User ID: {defaultUserId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </Button>
        </div>

        {/* Data Status */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              📊 Data Status
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <Bell className="w-3 h-3" />
                <span>Auto-refresh: 30s</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Total summaries loaded: <strong>{summaries.length}</strong>
          </p>
          <p className="text-xs text-blue-500">
            User ID: {defaultUserId}
          </p>
          
          {/* Debug Section */}
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="font-semibold text-yellow-800 mb-1">🔧 Debug Info:</p>
            <p className="text-yellow-700">Current User ID: <code className="bg-yellow-100 px-1 rounded">{defaultUserId}</code></p>
            <p className="text-yellow-700">LocalStorage User ID: <code className="bg-yellow-100 px-1 rounded">{localStorage.getItem('chat_user_id') || 'Not found'}</code></p>
            <p className="text-yellow-700">API Endpoint: <code className="bg-yellow-100 px-1 rounded">/openai/summaries/{defaultUserId}</code></p>
          </div>
          
          {summaries.length > 0 ? (
            <div className="mt-2 text-sm text-blue-600">
              <p>✅ Data found! Sample summary:</p>
              <div className="mt-1 p-2 bg-blue-100 rounded text-xs">
                <strong>Client:</strong> {summaries[0]?.summary?.client_name}<br/>
                <strong>Region:</strong> {summaries[0]?.summary?.client_region}<br/>
                <strong>Vertical:</strong> {summaries[0]?.summary?.vertical}<br/>
                <strong>Status:</strong> {summaries[0]?.summary?.project_status}<br/>
                <strong>Feedback:</strong> {summaries[0]?.summary?.feedback}
              </div>
              <p className="mt-2 text-xs text-blue-500">
                💡 Auto-refreshing every 30 seconds to get latest data
              </p>
            </div>
          ) : (
            <div className="mt-2 text-sm text-blue-600">
              <p>📝 No data found yet. To see analytics:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go back to the chat interface</li>
                <li>Upload a file (PDF, DOCX, or TXT)</li>
                <li>Click "Submit for Summarizing"</li>
                <li>Return here to see the analytics</li>
              </ol>
              <p className="mt-2 text-xs text-blue-500">
                💡 Data will automatically refresh when new summaries are added
              </p>
              <p className="mt-1 text-xs text-blue-400">
                🔍 Make sure you're using the same browser session as the chat interface
              </p>
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard 
          summaries={summaries} 
          isLoading={refreshing}
          onRefresh={handleRefresh}
        />

        {/* Debug Info - Only show if no data */}
        {summaries.length === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Current User ID:</strong> {defaultUserId}</p>
              <p><strong>LocalStorage User ID:</strong> {localStorage.getItem('chat_user_id') || 'Not set'}</p>
              <p><strong>API Endpoint:</strong> /openai/summaries/{defaultUserId}</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Troubleshooting:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Make sure you've uploaded and summarized files in the chat interface</li>
                <li>• Try using the same browser session for both chat and analytics</li>
                <li>• Check the console logs for API response details</li>
              </ul>
            </div>
          </div>
        )}

        {/* Data Flow Explanation */}
        {summaries.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Data found! Sample summary:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Client:</strong> {summaries[0].summary.client_name}</p>
              <p><strong>Region:</strong> {summaries[0].summary.client_region}</p>
              <p><strong>Vertical:</strong> {summaries[0].summary.vertical}</p>
              <p><strong>Status:</strong> {summaries[0].summary.project_status}</p>
              <p><strong>Feedback:</strong> {summaries[0].summary.feedback}</p>
            </div>
            <p className="text-xs text-green-600 mt-2">
              💡 Auto-refreshing every 30 seconds to get latest data
            </p>
          </div>
        )}

        {/* Data Flow Explanation */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-800 mb-2">🔄 How the Data Flow Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-slate-700">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl mb-2">1</div>
              <strong>File Upload</strong><br/>
              Upload PDF/DOCX/TXT files in the chat interface
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl mb-2">2</div>
              <strong>AI Analysis</strong><br/>
              OpenAI extracts key information and generates JSON
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl mb-2">3</div>
              <strong>Database Storage</strong><br/>
              JSON data stored in MongoDB with structure:
              <code className="block text-xs mt-1 p-1 bg-slate-100 rounded">
                {`{ "user_name": "extracted name", "client_name": "extracted client", "client_region": "extracted region", "vertical": "business vertical", "feedback": "Positive/Negative/Neutral", "project_status": "on-going/completed/pending" }`}
              </code>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl mb-2">4</div>
              <strong>Analytics Dashboard</strong><br/>
              Fetches JSON data and creates visualizations
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl mb-2">5</div>
              <strong>Auto-Refresh</strong><br/>
              Dashboard automatically updates every 30 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 