# AIron Rush - AI-Powered Chat & Sales Intelligence Platform

A comprehensive AI-powered platform that combines chat functionality with advanced analytics and financial intelligence for sales teams.

## Features

### 1. AI Chat Interface
- **Smart Chat**: Interactive AI chat with file upload capabilities
- **Session Management**: Create and manage multiple chat sessions
- **File Analysis**: Upload documents (PDF, DOCX, TXT) for AI analysis
- **Real-time Streaming**: Get responses in real-time with streaming chat
- **Context Awareness**: AI maintains conversation context across sessions

### 2. Analytics Dashboard
- **Data Visualization**: Interactive charts and graphs for file summaries
- **Filtering & Search**: Advanced filtering by region, vertical, status, and feedback
- **Export Capabilities**: Export data as CSV for further analysis
- **Real-time Updates**: Dashboard updates automatically with new data

### 3. Sales Buddy - Financial Intelligence
- **Company Analysis**: Get comprehensive financial data for any company
- **AI-Powered Insights**: LLM-generated insights and recommendations
- **Risk Assessment**: Automated risk analysis and assessment
- **Growth Metrics**: Key performance indicators and growth analysis
- **Interactive Visualizations**: Charts and graphs for financial data

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **FastAPI** with Python
- **OpenAI GPT-3.5-turbo** for AI responses
- **MongoDB** for data storage
- **yfinance** for financial data
- **Plotly** for data visualization
- **Uvicorn** for ASGI server

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB (local or cloud)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-session-ai-buddy-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ..
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGO_URI=mongodb://localhost:27017/
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   source venv/bin/activate
   python openai_chatbot.py
   ```

7. **Start the frontend development server**
   ```bash
   cd chat-session-ai-buddy-main
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000

## Usage

### Chat Interface
1. Navigate to the Chat page
2. Create a new session or load an existing one
3. Type your message or upload a file
4. Get AI-powered responses and insights

### Analytics Dashboard
1. Navigate to the Analytics page
2. View file summaries and insights
3. Use filters to analyze specific data
4. Export data as needed

### Sales Buddy
1. Navigate to the Sales Buddy page
2. Enter a company name (e.g., Apple, Tesla, Microsoft)
3. Get comprehensive financial analysis
4. Review AI-generated insights and recommendations
5. Explore interactive visualizations

## API Endpoints

### Chat & Sessions
- `POST /openai/sessions` - Create new chat session
- `GET /openai/users/{user_id}/sessions` - Get user sessions
- `GET /openai/sessions/{session_id}/history` - Get chat history
- `POST /openai/chat` - Send chat message
- `POST /openai/stream-chat` - Stream chat response

### File Analysis
- `POST /openai/summarize-file` - Summarize uploaded file
- `GET /openai/summaries/{user_id}` - Get user file summaries

### Financial Analysis
- `POST /openai/financial-analysis` - Get company financial data
- `POST /openai/financial-insights` - Get AI-powered financial insights

### Health Check
- `GET /openai/health` - API health status

## Project Structure

```
chat-session-ai-buddy-main/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets
└── package.json           # Frontend dependencies

../ (root)
├── openai_chatbot.py      # Backend FastAPI server
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
