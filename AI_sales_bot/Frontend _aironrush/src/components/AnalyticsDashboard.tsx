import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  MapPin, 
  Building2, 
  FileText, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Rocket,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { FileSummaryRecord } from '../types/chatTypes';
import Plot from 'react-plotly.js';

interface AnalyticsDashboardProps {
  summaries: FileSummaryRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summaries,
  isLoading,
  onRefresh
}) => {
  const [filteredSummaries, setFilteredSummaries] = useState<FileSummaryRecord[]>(summaries);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVertical, setSelectedVertical] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showJsonData, setShowJsonData] = useState<boolean>(false);

  // Filter summaries based on search and filters
  const filteredSummariesMemo = useMemo(() => {
    return summaries.filter(summary => {
      const matchesSearch = searchTerm === '' || 
        summary.summary.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.summary.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = selectedRegion === 'all' || summary.summary.client_region === selectedRegion;
      const matchesVertical = selectedVertical === 'all' || summary.summary.vertical === selectedVertical;
      const matchesStatus = selectedStatus === 'all' || summary.summary.project_status === selectedStatus;
      const matchesFeedback = selectedFeedback === 'all' || summary.summary.feedback === selectedFeedback;

      return matchesSearch && matchesRegion && matchesVertical && matchesStatus && matchesFeedback;
    });
  }, [summaries, searchTerm, selectedRegion, selectedVertical, selectedStatus, selectedFeedback]);

  // Get unique values for filters
  const regions = useMemo(() => ['all', ...Array.from(new Set(summaries.map(s => s.summary.client_region).filter(r => r !== 'Unknown')))], [summaries]);
  const verticals = useMemo(() => ['all', ...Array.from(new Set(summaries.map(s => s.summary.vertical).filter(v => v !== 'Unknown')))], [summaries]);
  const statuses = useMemo(() => ['all', ...Array.from(new Set(summaries.map(s => s.summary.project_status)))], [summaries]);
  const feedbacks = useMemo(() => ['all', ...Array.from(new Set(summaries.map(s => s.summary.feedback)))], [summaries]);

  // Calculate metrics
  const totalFiles = summaries.length;
  const uniqueClients = new Set(summaries.map(s => s.summary.client_name)).size;
  const uniqueRegions = new Set(summaries.map(s => s.summary.client_region)).size;
  const uniqueVerticals = new Set(summaries.map(s => s.summary.vertical)).size;

  // Status distribution
  const statusCounts = summaries.reduce((acc, summary) => {
    const status = summary.summary.project_status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Feedback distribution
  const feedbackCounts = summaries.reduce((acc, summary) => {
    const feedback = summary.summary.feedback.toLowerCase();
    acc[feedback] = (acc[feedback] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Region distribution
  const regionCounts = summaries.reduce((acc, summary) => {
    const region = summary.summary.client_region;
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Vertical distribution
  const verticalCounts = summaries.reduce((acc, summary) => {
    const vertical = summary.summary.vertical;
    acc[vertical] = (acc[vertical] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for charts
  const chartData = useMemo(() => {
    // Status distribution
    const statusData = {
      x: ['Completed', 'On-Going', 'Pending'],
      y: [
        summaries.filter(s => s.summary.project_status === 'completed').length,
        summaries.filter(s => s.summary.project_status === 'on-going').length,
        summaries.filter(s => s.summary.project_status === 'pending').length
      ],
      type: 'bar' as const,
      marker: { color: ['#10b981', '#3b82f6', '#f59e0b'] },
      name: 'Project Status'
    };

    // Feedback distribution
    const feedbackData = {
      x: ['Positive', 'Negative', 'Neutral'],
      y: [
        summaries.filter(s => s.summary.feedback === 'Positive').length,
        summaries.filter(s => s.summary.feedback === 'Negative').length,
        summaries.filter(s => s.summary.feedback === 'Neutral').length
      ],
      type: 'bar' as const,
      marker: { color: ['#10b981', '#ef4444', '#6b7280'] },
      name: 'Feedback'
    };

    // Vertical distribution
    const verticalData = {
      x: Object.keys(verticalCounts),
      y: Object.values(verticalCounts),
      type: 'bar' as const,
      marker: { color: '#8b5cf6' },
      name: 'Business Vertical'
    };

    // Region distribution
    const regionData = {
      x: Object.keys(regionCounts),
      y: Object.values(regionCounts),
      type: 'bar' as const,
      marker: { color: '#f97316' },
      name: 'Client Region'
    };

    return { statusData, feedbackData, verticalData, regionData };
  }, [summaries, regionCounts, verticalCounts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-going': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackColor = (feedback: string) => {
    switch (feedback.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportData = () => {
    const csvContent = [
      ['File Name', 'User Name', 'Client Name', 'Region', 'Vertical', 'Feedback', 'Status', 'Summary', 'Created At'],
      ...filteredSummaries.map(s => [
        s.file_name,
        s.summary.user_name,
        s.summary.client_name,
        s.summary.client_region,
        s.summary.vertical,
        s.summary.feedback,
        s.summary.project_status,
        s.summary.input_summary.replace(/,/g, ';'),
        s.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airon_rush_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uniqueRegionsList = Array.from(new Set(summaries.map(s => s.summary.client_region)));
  const uniqueVerticalsList = Array.from(new Set(summaries.map(s => s.summary.vertical)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Rocket className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-800">AIron Rush Analytics Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowJsonData(!showJsonData)}
            className="flex items-center space-x-2"
          >
            {showJsonData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showJsonData ? 'Hide' : 'Show'} JSON Data</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* JSON Data Viewer */}
      {showJsonData && summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Raw JSON Data from Database</span>
            </CardTitle>
            <CardDescription>
              This shows the actual JSON structure being fetched from MongoDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <pre className="text-xs bg-slate-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(summaries, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Search</label>
              <Input
                placeholder="Search clients, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Vertical</label>
              <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  {verticals.map(vertical => (
                    <SelectItem key={vertical} value={vertical}>{vertical}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on-going">On-going</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Feedback</label>
              <Select value={selectedFeedback} onValueChange={setSelectedFeedback}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="text-sm">
                {filteredSummaries.length} of {totalFiles} files
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Processed documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients}</div>
            <p className="text-xs text-muted-foreground">
              Different clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueRegions}</div>
            <p className="text-xs text-muted-foreground">
              Geographic regions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verticals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVerticals}</div>
            <p className="text-xs text-muted-foreground">
              Business verticals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Project Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / totalFiles) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Feedback Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(feedbackCounts).map(([feedback, count]) => (
                <div key={feedback} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getFeedbackColor(feedback)}>
                      {feedback}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(count / totalFiles) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Regions and Verticals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Top Regions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(regionCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{region}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${(count / totalFiles) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Verticals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Top Verticals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(verticalCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([vertical, count]) => (
                  <div key={vertical} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{vertical}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${(count / totalFiles) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>File Summaries</span>
          </CardTitle>
          <CardDescription>
            Detailed view of all processed files and their extracted data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {filteredSummaries.map((summary, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{summary.file_name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(summary.summary.project_status)}>
                        {summary.summary.project_status}
                      </Badge>
                      <Badge className={getFeedbackColor(summary.summary.feedback)}>
                        {summary.summary.feedback}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div><strong>User:</strong> {summary.summary.user_name}</div>
                    <div><strong>Client:</strong> {summary.summary.client_name}</div>
                    <div><strong>Region:</strong> {summary.summary.client_region}</div>
                    <div><strong>Vertical:</strong> {summary.summary.vertical}</div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {summary.summary.input_summary}
                  </p>
                  <p className="text-xs text-slate-400">
                    Created: {new Date(summary.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}; 