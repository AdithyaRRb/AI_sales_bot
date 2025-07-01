# AIron Rush - AI-Powered Chat Application

A modern AI-powered chat application with file upload, summarization, and session management capabilities.

## Features

### 🗨️ Page 1: Chat Interface
- **Session Management**: Create and manage multiple chat sessions
- **AI Chat**: Interactive chat with OpenAI models (GPT-3.5, GPT-4, GPT-4 Turbo)
- **File Upload**: Upload PDF, DOCX, and TXT files for context-aware conversations
- **Streaming Responses**: Real-time streaming of AI responses
- **Chat History**: Persistent chat history with session management
- **Export Functionality**: Export chat conversations

### 📁 Page 2: File Upload & Summarization
- **Document Processing**: Upload and process PDF, DOCX, and TXT files
- **AI Summarization**: Extract key information in structured JSON format
- **Real-time Processing**: See processing status and results immediately
- **Summary History**: View recently generated summaries

### 📊 Page 3: Summary Dashboard
- **Comprehensive View**: View all generated summaries in a detailed dashboard
- **Advanced Filtering**: Filter by status, feedback, and search terms
- **Statistics**: View summary statistics and analytics
- **Export Functionality**: Export summaries to CSV format
- **Responsive Design**: Mobile-friendly interface

## Data Structure

The application generates summaries in the following JSON format:

```json
{
  "user_name": "extracted user name",
  "input_summary": "comprehensive summary of the document",
  "client_name": "extracted client name",
  "client_region": "extracted region",
  "vertical": "extracted business vertical",
  "feedback": "Positive/Negative/Neutral",
  "project_status": "on-going/completed/pending",
  "timestamp": "ISO timestamp"
}
```

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI API**: AI model integration
- **MongoDB**: Database for storing sessions, messages, and summaries
- **PyPDF2**: PDF text extraction
- **python-docx**: DOCX file processing

### Frontend
- **React 18**: Modern React with TypeScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful UI components
- **React Router**: Client-side routing
- **Lucide React**: Icon library

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGO_URI=mongodb://localhost:27017/
   ```

3. **Start the backend server**:
   ```bash
   python openai_chatbot.py
   ```
   The server will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd chat-session-ai-buddy-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:8080`

## API Endpoints

### Chat Endpoints
- `POST /openai/sessions` - Create a new chat session
- `GET /openai/users/{cognito_id}/sessions` - Get user sessions
- `GET /openai/sessions/{session_id}/history` - Get chat history
- `POST /openai/chat` - Send a message to AI
- `POST /openai/stream-chat` - Stream AI responses

### File Summarization Endpoints
- `POST /openai/summarize-file` - Upload and summarize a file
- `GET /openai/summaries/{user_id}` - Get user summaries

### Health Check
- `GET /openai/health` - API health check

## Usage

1. **Start both servers** (backend and frontend)
2. **Open your browser** and navigate to `http://localhost:8080`
3. **Use the navigation bar** to switch between the three pages:
   - **Chat**: Create sessions and chat with AI
   - **Upload**: Upload files for summarization
   - **Summaries**: View and manage all summaries

## File Support

The application supports the following file types:
- **PDF** (.pdf) - Text extraction using PyPDF2
- **DOCX** (.docx) - Text extraction using python-docx
- **TXT** (.txt) - Direct text processing

## Features Removed

As requested, the following features have been removed:
- ❌ Test case generation
- ❌ Test scenario generation
- ❌ Complex QA workflows

The application now focuses on:
- ✅ Simple chat interface
- ✅ File summarization with structured output
- ✅ Clean, modern UI
- ✅ Easy navigation between pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 