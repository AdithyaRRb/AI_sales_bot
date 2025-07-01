import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Building2, Lightbulb, Target, Users, Globe } from "lucide-react";
import { ApiService } from "@/utils/apiService";
import Plot from 'react-plotly.js';

interface FinancialData {
  ticker: string;
  company_name: string;
  financials: any;
  balance_sheet: any;
  cashflow: any;
  earnings: any;
  quarterly_financials: any;
  quarterly_balance_sheet: any;
  quarterly_cashflow: any;
}

interface AnalysisResult {
  insights: string;
  recommendations: string;
  risk_assessment: string;
  growth_metrics: any;
  charts_data: any;
  innovation_ideas: string;
  current_trends: string;
  market_position: string;
  competitive_analysis: string;
}

const SalesBuddy: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeCompany = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFinancialData(null);
    setAnalysisResult(null);

    try {
      // First, get financial data
      const financialResponse = await ApiService.analyzeFinancialData(companyName);

      if (financialResponse.success) {
        setFinancialData(financialResponse.financial_data);
        
        // Then, get AI analysis and insights
        const analysisResponse = await ApiService.getFinancialInsights(companyName, financialResponse.financial_data);

        if (analysisResponse.success) {
          setAnalysisResult(analysisResponse.analysis);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze company');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample chart data for demonstration
  const generateSampleCharts = () => {
    const revenueData = {
      x: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'],
      y: [100, 120, 115, 140, 135, 160],
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Revenue Trend',
      line: { color: '#10b981' }
    };

    const profitData = {
      x: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'],
      y: [15, 18, 17, 22, 20, 25],
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Profit Margin %',
      line: { color: '#3b82f6' }
    };

    const marketShareData = {
      x: ['Company A', 'Company B', 'Company C', 'Our Company', 'Company D'],
      y: [25, 20, 15, 30, 10],
      type: 'bar' as const,
      marker: { color: ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#6b7280'] },
      name: 'Market Share %'
    };

    return { revenueData, profitData, marketShareData };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Building2 className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            AI Sales Buddy
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-Powered Sales Intelligence Platform - Transform scattered financial data into actionable insights
        </p>
        <Badge variant="secondary" className="text-sm">
          AI Hackathon June 2025 - Customer Obsession
        </Badge>
      </div>

      {/* Company Analysis Input */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Company Financial Analysis</span>
          </CardTitle>
          <CardDescription>
            Enter a company name to get comprehensive financial analysis, innovation ideas, and AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <div className="flex space-x-2">
              <Input
                id="company"
                placeholder="e.g., Apple, Tesla, Microsoft, Amazon, Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeCompany()}
              />
              <Button 
                onClick={handleAnalyzeCompany} 
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Analyze
              </Button>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {financialData && (
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <span>{financialData.company_name} ({financialData.ticker})</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Analysis Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="innovation">Innovation</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="recommendations">Strategy</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {analysisResult && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span>Key Insights</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisResult.insights}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <span>Market Position</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisResult.market_position || "Market position analysis will be generated based on financial data and industry trends."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        <span>Current Trends</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisResult.current_trends || "Current industry trends and market dynamics affecting the company."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span>Competitive Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisResult.competitive_analysis || "Analysis of competitive landscape and positioning."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {analysisResult && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span>Growth Metrics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.growth_metrics ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Revenue Growth:</span>
                            <Badge variant="outline">{analysisResult.growth_metrics.revenue_growth}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Profit Margin:</span>
                            <Badge variant="outline">{analysisResult.growth_metrics.profit_margin}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Debt Ratio:</span>
                            <Badge variant="outline">{analysisResult.growth_metrics.debt_ratio}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Liquidity:</span>
                            <Badge variant="outline">{analysisResult.growth_metrics.liquidity}</Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Growth metrics will be calculated from financial data.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <span>Risk Assessment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisResult.risk_assessment}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="innovation" className="space-y-4">
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span>Innovation Ideas & Opportunities</span>
                    </CardTitle>
                    <CardDescription>
                      AI-generated innovation opportunities based on financial analysis and market trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">💡 Innovation Ideas</h4>
                        <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                          {analysisResult.innovation_ideas || "Based on the company's financial position and market trends, here are potential innovation opportunities:\n\n• Digital transformation initiatives\n• New market expansion strategies\n• Product development opportunities\n• Operational efficiency improvements\n• Strategic partnerships and acquisitions"}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">🚀 Growth Opportunities</h4>
                        <p className="text-sm text-blue-700 whitespace-pre-wrap">
                          {analysisResult.current_trends || "Current market trends and growth opportunities:\n\n• Emerging technology adoption\n• Market expansion possibilities\n• Customer segment targeting\n• Operational optimization\n• Strategic investment areas"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue & Profit Trends</CardTitle>
                    <CardDescription>
                      Historical performance and growth patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Plot
                      data={[generateSampleCharts().revenueData, generateSampleCharts().profitData]}
                      layout={{
                        height: 300,
                        margin: { t: 40, b: 40, l: 40, r: 40 }
                      }}
                      config={{ displayModeBar: false }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Share Analysis</CardTitle>
                    <CardDescription>
                      Competitive positioning in the market
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Plot
                      data={[generateSampleCharts().marketShareData]}
                      layout={{
                        height: 300,
                        margin: { t: 40, b: 40, l: 40, r: 40 }
                      }}
                      config={{ displayModeBar: false }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span>Income Statement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(financialData.financials, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span>Balance Sheet</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(financialData.balance_sheet, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Recommendations</CardTitle>
                    <CardDescription>
                      AI-powered strategic recommendations based on comprehensive analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">📈 Strategic Recommendations</h4>
                        <p className="text-sm text-blue-700 whitespace-pre-wrap">
                          {analysisResult.recommendations}
                        </p>
                      </div>
                      
                      {analysisResult.growth_metrics && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">🎯 Action Items</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Focus on revenue diversification strategies</li>
                            <li>• Optimize operational efficiency</li>
                            <li>• Explore new market opportunities</li>
                            <li>• Strengthen competitive positioning</li>
                            <li>• Invest in innovation and R&D</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SalesBuddy; 