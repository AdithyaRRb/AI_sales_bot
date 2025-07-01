const API_BASE_URL = "http://localhost:8000/openai";

export class ApiService {
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  }

  static async createSession(userInfo: any, title?: string): Promise<any> {
    const payload = {
      ...userInfo,
      title: title || `Session ${new Date().toLocaleString()}`
    };

    console.log("API Service - Creating session with payload:", payload);

    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log("API Service - Response status:", response.status);
    console.log("API Service - Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Service - Error response:", errorText);
      throw new Error(`Failed to create session: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("API Service - Session created successfully:", result);
    return result;
  }

  static async getUserSessions(cognitoId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/users/${cognitoId}/sessions`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sessions || [];
  }

  static async getSessionHistory(sessionId: string, limit: number = 50): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  }

  static async sendMessage(
    sessionId: string,
    userId: string,
    message: string,
    model: string,
    file?: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);
    formData.append('message', message);
    formData.append('model', model);

    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  static async streamMessage(
    sessionId: string,
    userId: string,
    message: string,
    model: string,
    file: File | undefined,
    onChunk: (chunk: string) => void,
    onFileSummary?: (fileSummary: any) => void
  ): Promise<void> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);
    formData.append('message', message);
    formData.append('model', model);

    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}/stream-chat`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to stream message: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              onChunk(data.content);
            }
            if (data.file_summary && onFileSummary) {
              onFileSummary(data.file_summary);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }
  }

  static async summarizeFile(userId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/summarize-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to summarize file: ${response.statusText}`);
    }

    return response.json();
  }

  static async getUserSummaries(userId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/summaries/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch summaries: ${response.statusText}`);
    }

    const data = await response.json();
    return data.summaries || [];
  }

  static async analyzeFinancialData(companyName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/financial-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_name: companyName })
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze financial data: ${response.statusText}`);
    }

    return response.json();
  }

  static async getFinancialInsights(companyName: string, financialData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/financial-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        company_name: companyName,
        financial_data: financialData 
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get financial insights: ${response.statusText}`);
    }

    return response.json();
  }
}
