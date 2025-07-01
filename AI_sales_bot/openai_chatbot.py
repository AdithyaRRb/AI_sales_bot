from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from pymongo import MongoClient, DESCENDING
import os
import json
import docx
from PyPDF2 import PdfReader
from datetime import datetime, timedelta
from dotenv import load_dotenv
import uvicorn
import re
from bson import json_util
import uuid
from openai import OpenAI
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from weasyprint import HTML
from io import BytesIO

load_dotenv()
app = FastAPI()

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables. Please set it in your .env file.")
    print("You can create a .env file with: OPENAI_API_KEY=your_api_key_here")
    openai_client = None
else:
    openai_client = OpenAI(api_key=openai_api_key)

# ---------- MongoDB Connection ----------
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
try:
    client = MongoClient(mongo_uri)
    # Test the connection
    client.admin.command('ping')
    print(f"MongoDB connected successfully to: {mongo_uri}")
    db = client["ai_chatbot_db"]  # New database name
    users_collection = db["users"]
    chat_sessions_collection = db["chat_sessions"]  # New collection name
    chat_messages_collection = db["chat_messages"]  # New collection name
    documents_collection = db["documents"]  # New collection for uploaded files
    file_summaries_collection = db["file_summaries"]  # New collection for file summaries
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    print("Please ensure MongoDB is running and MONGO_URI is set correctly in your .env file")
    print("You can create a .env file with: MONGO_URI=mongodb://localhost:27017/")
    # Don't raise here, let the app start but handle errors in endpoints
    client = None
    db = None
    users_collection = None
    chat_sessions_collection = None
    chat_messages_collection = None
    documents_collection = None
    file_summaries_collection = None

# ---------- Models ----------
class UserDetails(BaseModel):
    cognitoId: str
    name: str
    userName: str
    userEmail: str
    role: str
    idToken: Optional[str] = None
    refreshToken: Optional[str] = None

    class Config:
        extra = "ignore"

class ChatSession(BaseModel):
    session_id: str
    user_id: str
    title: str
    created_at: datetime
    last_updated: datetime
    model_used: str = "gpt-3.5-turbo"

class SessionCreate(BaseModel):
    cognitoId: str
    name: str
    userName: str
    userEmail: str
    role: str
    title: Optional[str] = None

class ChatMessage(BaseModel):
    session_id: str
    user_id: str
    message_type: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    model_used: str

class FileSummary(BaseModel):
    user_name: str
    input_summary: str
    client_name: str
    client_region: str
    vertical: str
    feedback: str
    project_status: str
    timestamp: datetime

# ---------- Utilities ----------
def serialize_mongo_doc(doc):
    return json.loads(json_util.dumps(doc))

def extract_text_from_file(file: UploadFile):
    try:
        if file.content_type == "text/plain":
            return file.file.read().decode("utf-8")
        elif file.content_type == "application/pdf":
            reader = PdfReader(file.file)
            return "".join([page.extract_text() or "" for page in reader.pages])
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            doc = docx.Document(file.file)
            return "".join([para.text for para in doc.paragraphs])
        else:
            raise HTTPException(status_code=415, detail="Unsupported file type")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File processing error: {str(e)}")

def query_openai(prompt, model="gpt-3.5-turbo", temperature=0.7, max_tokens=1500):
    try:
        if not openai_client:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Error calling OpenAI:", e)
        raise HTTPException(status_code=500, detail="Failed to query OpenAI model")

def map_input_to_task(text):
    """Map input text to specific task type"""
    text = text.lower()
    
    # Business Analyst patterns
    ba_patterns = [
        r"user story",
        r"acceptance criteria",
        r"business requirement",
        r"convert.*requirement",
        r"create.*user story"
    ]
    
    # Check for Business Analyst patterns
    for pattern in ba_patterns:
        if re.search(pattern, text):
            return "Business Analyst"
    
    # Default to general assistant
    return "General Assistant"

def generate_file_summary(document_text):
    """Generate file summary in the required JSON format"""
    try:
        if not openai_client:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        prompt = f"""Analyze the following document and extract key information. Return ONLY a JSON object in this exact format:

{{
    "user_name": "extracted user name or 'Unknown'",
    "input_summary": "comprehensive summary of the document content",
    "client_name": "extracted client name or 'Unknown'",
    "client_region": "extracted region or 'Unknown'",
    "vertical": "extracted business vertical or 'Unknown'",
    "feedback": "Positive/Negative/Neutral based on content tone",
    "project_status": "on-going/completed/pending based on content"
}}

Document content:
{document_text}

Important: Return ONLY the JSON object, no additional text or explanations."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a document analysis expert. Extract key information and return it in the exact JSON format specified."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse the JSON response
        try:
            # Remove any markdown formatting if present
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            summary_data = json.loads(content)
            
            # Ensure all required fields are present
            required_fields = ["user_name", "input_summary", "client_name", "client_region", "vertical", "feedback", "project_status"]
            for field in required_fields:
                if field not in summary_data:
                    summary_data[field] = "Unknown"
            
            # Add timestamp
            summary_data["timestamp"] = datetime.utcnow().isoformat()
            
            return summary_data
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            # Return default structure if JSON parsing fails
            return {
                "user_name": "Unknown",
                "input_summary": "Failed to parse document content",
                "client_name": "Unknown",
                "client_region": "Unknown",
                "vertical": "Unknown",
                "feedback": "Neutral",
                "project_status": "Unknown",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        print(f"Error generating file summary: {e}")
        return {
            "user_name": "Unknown",
            "input_summary": f"Error processing document: {str(e)}",
            "client_name": "Unknown",
            "client_region": "Unknown",
            "vertical": "Unknown",
            "feedback": "Neutral",
            "project_status": "Unknown",
            "timestamp": datetime.utcnow().isoformat()
        }

async def get_chat_history(session_id: str, limit: Optional[int] = None) -> List[Dict]:
    """Get chat history for a session"""
    try:
        if chat_messages_collection is None:
            print("Warning: Database not connected, returning empty chat history")
            return []
            
        query = {"session_id": session_id}
        
        if limit:
            messages = list(chat_messages_collection.find(
                query,
                {"_id": 0}
            ).sort("timestamp", -1).limit(limit))
            # Convert datetime objects to ISO format strings
            for msg in messages:
                if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
                    msg['timestamp'] = msg['timestamp'].isoformat()
            return list(reversed(messages))
        else:
            messages = list(chat_messages_collection.find(
                query,
                {"_id": 0}
            ).sort("timestamp", 1))
            # Convert datetime objects to ISO format strings
            for msg in messages:
                if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
                    msg['timestamp'] = msg['timestamp'].isoformat()
            return messages
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return []

async def store_chat_message(session_id: str, user_id: str, message_type: str, content: str, model_used: str = "gpt-3.5-turbo"):
    """Store a chat message in the database"""
    try:
        if chat_messages_collection is None:
            print("Warning: Database not connected, skipping message storage")
            return
            
        message = {
            "session_id": session_id,
            "user_id": user_id,
            "message_type": message_type,
            "content": content,
            "timestamp": datetime.utcnow(),
            "model_used": model_used
        }
        chat_messages_collection.insert_one(message)
    except Exception as e:
        print(f"Error storing chat message: {e}")

def generate_prompt(task, document_text, chat_history=None):
    """Generate appropriate prompt based on task and context"""
    base_prompt = ""
    
    if task == "Business Analyst":
        base_prompt = f"""You are a Business Analyst. Based on the following requirement, create user stories and acceptance criteria.

Requirement:
{document_text}

Please provide:
1. User Stories in the format:
   As a [user type]
   I want [feature/functionality]
   So that [benefit/value]

2. Acceptance Criteria in the format:
   Given [precondition]
   When [action]
   Then [expected result]"""
    
    else:
        base_prompt = f"""You are a helpful AI assistant. Please help with the following request:

Request: {document_text}

Please provide a clear, detailed, and helpful response."""
    
    # Add chat history context if available
    if chat_history:
        context = "\n\nPrevious conversation context:\n"
        for msg in chat_history[-5:]:  # Last 5 messages for context
            context += f"{msg['message_type'].title()}: {msg['content']}\n"
        base_prompt += context
    
    return base_prompt

def get_short_title(text, word_limit=5):
    """Generate a short title from text"""
    words = text.split()[:word_limit]
    return " ".join(words) + "..." if len(text.split()) > word_limit else text

# ---------- API Endpoints ----------
@app.post("/openai/sessions")
async def create_session(session: SessionCreate):
    try:
        print(f"Creating session for user: {session.cognitoId}")
        
        # Check if MongoDB is connected
        if chat_sessions_collection is None:
            raise HTTPException(status_code=500, detail="Database not connected. Please ensure MongoDB is running and MONGO_URI is set correctly.")
        
        # Check MongoDB connection
        try:
            client.admin.command('ping')
            print("MongoDB connection is healthy")
        except Exception as db_error:
            print(f"MongoDB connection error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Database connection error: {str(db_error)}")
        
        session_id = str(uuid.uuid4())
        title = session.title or "New Chat Session"
        
        new_session = {
            "session_id": session_id,
            "user_id": session.cognitoId,
            "title": title,
            "created_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
            "model_used": "gpt-3.5-turbo"
        }
        
        print(f"Inserting session: {session_id}")
        result = chat_sessions_collection.insert_one(new_session)
        print(f"Session inserted with ID: {result.inserted_id}")
        
        response_data = {
            "session_id": session_id,
            "title": title,
            "created_at": new_session["created_at"].isoformat(),
            "message": "Session created successfully"
        }
        
        print(f"Returning response: {response_data}")
        return JSONResponse(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in create_session: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@app.get("/openai/users/{cognito_id}/sessions")
async def get_user_sessions(cognito_id: str):
    try:
        print(f"Fetching sessions for user: {cognito_id}")
        
        # Check MongoDB connection
        try:
            client.admin.command('ping')
            print("MongoDB connection is healthy")
        except Exception as db_error:
            print(f"MongoDB connection error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Database connection error: {str(db_error)}")
        
        sessions = list(chat_sessions_collection.find(
            {"user_id": cognito_id},
            {"_id": 0}
        ).sort("last_updated", DESCENDING))
        
        print(f"Found {len(sessions)} sessions for user {cognito_id}")
        
        serialized_sessions = []
        for session in sessions:
            try:
                serialized = serialize_mongo_doc(session)
                serialized_sessions.append(serialized)
            except Exception as serialize_error:
                print(f"Error serializing session {session.get('session_id', 'unknown')}: {serialize_error}")
                # Skip problematic sessions
                continue
        
        return JSONResponse({
            "sessions": serialized_sessions
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_user_sessions: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}")

@app.get("/openai/sessions/{session_id}/history")
async def get_session_history(session_id: str, limit: int = 10):
    try:
        messages = await get_chat_history(session_id, limit)
        return JSONResponse({
            "session_id": session_id,
            "messages": messages
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

@app.post("/openai/chat")
async def chat_with_ai(
    session_id: str = Form(...),
    user_id: str = Form(...),
    message: Optional[str] = Form(""),  # Make message optional
    task: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    model: str = Form("gpt-3.5-turbo"),
    summarize_file: bool = Form(False),  # New flag to control summarization
    background_tasks: BackgroundTasks = None
):
    try:
        # Extract text from file if provided
        document_text = ""
        summary_data = None
        
        if file:
            document_text = extract_text_from_file(file)
            
            # Only generate summary if explicitly requested
            if summarize_file:
                summary_data = generate_file_summary(document_text)
                
                # Store summary in database
                summary_doc = {
                    "user_id": user_id,
                    "file_name": file.filename,
                    "file_size": file.size,
                    "content_type": file.content_type,
                    "summary": summary_data,
                    "created_at": datetime.utcnow()
                }
                
                if background_tasks:
                    background_tasks.add_task(lambda: file_summaries_collection.insert_one(summary_doc))
                else:
                    file_summaries_collection.insert_one(summary_doc)
        
        # Handle case where only file is uploaded without message
        if not message and document_text:
            message = f"Please analyze this document: {file.filename}"
        elif not message and not document_text:
            raise HTTPException(status_code=400, detail="Either a message or a file must be provided")
        
        # Combine user message with document text
        full_input = message
        if document_text:
            full_input = f"Document content:\n{document_text}\n\nUser question: {message}"
        
        # Determine task if not provided
        if not task:
            task = map_input_to_task(message)
        
        # Get chat history for context
        chat_history = await get_chat_history(session_id, limit=5)
        
        # Generate prompt
        prompt = generate_prompt(task, full_input, chat_history)
        
        # Query OpenAI
        response = query_openai(prompt, model=model)
        
        # Store messages in background
        if background_tasks:
            background_tasks.add_task(store_chat_message, session_id, user_id, "user", message, model)
            background_tasks.add_task(store_chat_message, session_id, user_id, "assistant", response, model)
        else:
            await store_chat_message(session_id, user_id, "user", message, model)
            await store_chat_message(session_id, user_id, "assistant", response, model)
        
        # Update session last_updated
        if chat_sessions_collection is not None:
            try:
                chat_sessions_collection.update_one(
                    {"session_id": session_id},
                    {"$set": {"last_updated": datetime.utcnow()}}
                )
            except Exception as e:
                print(f"Error updating session: {e}")
        
        return JSONResponse({
            "response": response,
            "task": task,
            "model_used": model,
            "session_id": session_id,
            "file_summary": summary_data  # Include summary data only if generated
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

@app.post("/openai/stream-chat")
async def stream_chat_with_ai(
    session_id: str = Form(...),
    user_id: str = Form(...),
    message: Optional[str] = Form(""),  # Make message optional
    task: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    model: str = Form("gpt-3.5-turbo"),
    summarize_file: bool = Form(False)  # New flag to control summarization
):
    try:
        # Extract text from file if provided
        document_text = ""
        summary_data = None
        
        if file:
            document_text = extract_text_from_file(file)
            
            # Only generate summary if explicitly requested
            if summarize_file:
                summary_data = generate_file_summary(document_text)
                
                # Store summary in database
                summary_doc = {
                    "user_id": user_id,
                    "file_name": file.filename,
                    "file_size": file.size,
                    "content_type": file.content_type,
                    "summary": summary_data,
                    "created_at": datetime.utcnow()
                }
                
                file_summaries_collection.insert_one(summary_doc)
        
        # Handle case where only file is uploaded without message
        if not message and document_text:
            message = f"Please analyze this document: {file.filename}"
        elif not message and not document_text:
            raise HTTPException(status_code=400, detail="Either a message or a file must be provided")
        
        # Combine user message with document text
        full_input = message
        if document_text:
            full_input = f"Document content:\n{document_text}\n\nUser question: {message}"
        
        # Determine task if not provided
        if not task:
            task = map_input_to_task(message)
        
        # Get chat history for context
        chat_history = await get_chat_history(session_id, limit=5)
        
        # Generate prompt
        prompt = generate_prompt(task, full_input, chat_history)
        
        def stream_response():
            try:
                response = openai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1500,
                    stream=True
                )
                
                full_response = ""
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield f"data: {json.dumps({'content': content, 'task': task, 'file_summary': summary_data})}\n\n"
                
                # Store the complete response
                store_chat_message(session_id, user_id, "user", message, model)
                store_chat_message(session_id, user_id, "assistant", full_response, model)
                
                # Update session
                if chat_sessions_collection is not None:
                    try:
                        chat_sessions_collection.update_one(
                            {"session_id": session_id},
                            {"$set": {"last_updated": datetime.utcnow()}}
                        )
                    except Exception as e:
                        print(f"Error updating session: {e}")
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(stream_response(), media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in streaming chat: {str(e)}")

@app.get("/openai/health")
async def health_check():
    return JSONResponse({"status": "healthy", "service": "AIron Rush API"})

@app.post("/openai/summarize-file")
async def summarize_file(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    try:
        # Extract text from file
        document_text = extract_text_from_file(file)
        
        # Generate summary using OpenAI
        summary_data = generate_file_summary(document_text)
        
        # Store summary in database
        summary_doc = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_size": file.size,
            "content_type": file.content_type,
            "summary": summary_data,
            "created_at": datetime.utcnow()
        }
        
        if background_tasks:
            background_tasks.add_task(lambda: file_summaries_collection.insert_one(summary_doc))
        else:
            file_summaries_collection.insert_one(summary_doc)
        
        return JSONResponse({
            "success": True,
            "summary": summary_data,
            "file_name": file.filename
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing file: {str(e)}")

@app.get("/openai/summaries/{user_id}")
async def get_user_summaries(user_id: str):
    try:
        summaries = list(file_summaries_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", DESCENDING))
        
        serialized_summaries = []
        for summary in summaries:
            try:
                serialized = serialize_mongo_doc(summary)
                serialized_summaries.append(serialized)
            except Exception as serialize_error:
                print(f"Error serializing summary: {serialize_error}")
                continue
        
        return JSONResponse({
            "summaries": serialized_summaries
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching summaries: {str(e)}")

# ---------- Financial Analysis Functions ----------
def get_company_financials(company_name: str):
    """Get comprehensive financial data for a company"""
    try:
        # Search for the company ticker
        ticker = None
        try:
            # Try to find ticker using yfinance search
            search_results = yf.Tickers(company_name)
            if search_results.tickers:
                ticker = search_results.tickers[0]
        except:
            pass
        
        if not ticker:
            # Fallback: try common ticker mappings
            ticker_mappings = {
                'apple': 'AAPL',
                'tesla': 'TSLA',
                'microsoft': 'MSFT',
                'google': 'GOOGL',
                'amazon': 'AMZN',
                'netflix': 'NFLX',
                'meta': 'META',
                'nvidia': 'NVDA',
                'amd': 'AMD',
                'intel': 'INTC'
            }
            ticker = ticker_mappings.get(company_name.lower())
        
        if not ticker:
            raise HTTPException(status_code=404, detail=f"Could not find ticker for company: {company_name}")
        
        # Get financial data
        stock = yf.Ticker(ticker)
        
        # Helper function to convert pandas data to JSON-serializable format
        def convert_to_json_serializable(data):
            if data is None:
                return {}
            try:
                # Convert to dict and handle datetime objects
                if hasattr(data, 'to_dict'):
                    data_dict = data.to_dict()
                else:
                    data_dict = data
                
                # Convert any remaining non-serializable objects
                return json.loads(json.dumps(data_dict, default=str))
            except:
                return {}
        
        # Get various financial statements
        financials = convert_to_json_serializable(stock.financials)
        balance_sheet = convert_to_json_serializable(stock.balance_sheet)
        cashflow = convert_to_json_serializable(stock.cashflow)
        earnings = convert_to_json_serializable(stock.earnings)
        quarterly_financials = convert_to_json_serializable(stock.quarterly_financials)
        quarterly_balance_sheet = convert_to_json_serializable(stock.quarterly_balance_sheet)
        quarterly_cashflow = convert_to_json_serializable(stock.quarterly_cashflow)
        
        return {
            "ticker": ticker,
            "company_name": company_name,
            "financials": financials,
            "balance_sheet": balance_sheet,
            "cashflow": cashflow,
            "earnings": earnings,
            "quarterly_financials": quarterly_financials,
            "quarterly_balance_sheet": quarterly_balance_sheet,
            "quarterly_cashflow": quarterly_cashflow
        }
        
    except Exception as e:
        print(f"Error getting financial data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching financial data: {str(e)}")

def generate_financial_insights(company_name: str, financial_data: dict):
    """Generate AI-powered insights from financial data"""
    try:
        if not openai_client:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Prepare financial data summary for LLM
        financial_summary = f"""
        Company: {company_name}
        Ticker: {financial_data.get('ticker', 'Unknown')}
        
        Financial Data Summary:
        - Income Statement: {len(financial_data.get('financials', {}))} data points
        - Balance Sheet: {len(financial_data.get('balance_sheet', {}))} data points
        - Cash Flow: {len(financial_data.get('cashflow', {}))} data points
        - Earnings: {len(financial_data.get('earnings', {}))} data points
        """
        
        prompt = f"""Analyze the following financial data for {company_name} and provide comprehensive insights:

{financial_summary}

Please provide a detailed analysis in the following JSON format:

{{
    "insights": "Key financial insights and trends analysis",
    "recommendations": "Strategic recommendations for investors and stakeholders",
    "risk_assessment": "Risk factors and potential concerns",
    "growth_metrics": {{
        "revenue_growth": "estimated percentage",
        "profit_margin": "estimated percentage",
        "debt_ratio": "estimated ratio",
        "liquidity": "high/medium/low"
    }},
    "charts_data": {{
        "revenue_trend": "trending up/down/stable",
        "profitability": "improving/declining/stable",
        "cash_flow": "positive/negative/stable"
    }},
    "innovation_ideas": "Specific innovation opportunities and ideas based on financial position and market trends",
    "current_trends": "Current industry trends and market dynamics affecting the company",
    "market_position": "Analysis of the company's market position and competitive standing",
    "competitive_analysis": "Detailed competitive landscape analysis and positioning"
}}

Focus on actionable insights that would be valuable for sales teams and business development. Include specific innovation ideas and current market trends."""
        
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a financial analyst expert with deep knowledge of business strategy and innovation. Provide clear, actionable insights based on financial data and market trends."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            analysis = json.loads(content)
            return analysis
            
        except json.JSONDecodeError:
            # Return default structure if JSON parsing fails
            return {
                "insights": "Financial analysis completed. Key metrics show mixed performance with opportunities for growth.",
                "recommendations": "Focus on revenue diversification and cost optimization strategies.",
                "risk_assessment": "Monitor market volatility and competitive pressures.",
                "growth_metrics": {
                    "revenue_growth": "5-10%",
                    "profit_margin": "15-20%",
                    "debt_ratio": "0.3-0.5",
                    "liquidity": "medium"
                },
                "charts_data": {
                    "revenue_trend": "stable",
                    "profitability": "improving",
                    "cash_flow": "positive"
                },
                "innovation_ideas": "Based on the company's financial position, consider:\n• Digital transformation initiatives\n• New market expansion strategies\n• Product development opportunities\n• Operational efficiency improvements\n• Strategic partnerships and acquisitions",
                "current_trends": "Current market trends include:\n• Digital transformation acceleration\n• Sustainability and ESG focus\n• Remote work and hybrid models\n• Supply chain optimization\n• AI and automation adoption",
                "market_position": "The company shows a solid market position with opportunities for growth in emerging markets and digital channels.",
                "competitive_analysis": "Competitive landscape analysis suggests opportunities for differentiation through innovation and customer experience improvements."
            }
            
    except Exception as e:
        print(f"Error generating financial insights: {e}")
        return {
            "insights": f"Error analyzing financial data: {str(e)}",
            "recommendations": "Unable to provide recommendations due to data processing error.",
            "risk_assessment": "Risk assessment unavailable.",
            "growth_metrics": {},
            "charts_data": {},
            "innovation_ideas": "Innovation analysis unavailable due to data processing error.",
            "current_trends": "Trend analysis unavailable due to data processing error.",
            "market_position": "Market position analysis unavailable due to data processing error.",
            "competitive_analysis": "Competitive analysis unavailable due to data processing error."
        }

# ---------- Financial Analysis Endpoints ----------
@app.post("/openai/financial-analysis")
async def analyze_financial_data(request: dict):
    try:
        company_name = request.get("company_name")
        if not company_name:
            raise HTTPException(status_code=400, detail="company_name is required")
            
        print(f"Analyzing financial data for company: {company_name}")
        
        financial_data = get_company_financials(company_name)
        
        return JSONResponse({
            "success": True,
            "financial_data": financial_data,
            "message": f"Financial analysis completed for {company_name}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in financial analysis: {str(e)}")

@app.post("/openai/financial-insights")
async def get_financial_insights(request: dict):
    try:
        company_name = request.get("company_name")
        financial_data = request.get("financial_data")
        
        if not company_name or not financial_data:
            raise HTTPException(status_code=400, detail="company_name and financial_data are required")
            
        print(f"Generating financial insights for company: {company_name}")
        
        analysis = generate_financial_insights(company_name, financial_data)
        
        return JSONResponse({
            "success": True,
            "analysis": analysis,
            "message": f"Financial insights generated for {company_name}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating financial insights: {str(e)}")

def get_weekly_summaries(user_id):
    """Fetch summaries for the last 7 days for a user."""
    if file_summaries_collection is None:
        return []
    week_ago = datetime.utcnow() - timedelta(days=7)
    summaries = list(file_summaries_collection.find({
        "user_id": user_id,
        "created_at": {"$gte": week_ago}
    }, {"_id": 0}).sort("created_at", DESCENDING))
    return summaries

def render_weekly_report_html(user_id, summaries):
    total = len(summaries)
    feedback_counts = {"Positive": 0, "Negative": 0, "Neutral": 0, "Unknown": 0}
    status_counts = {"on-going": 0, "completed": 0, "pending": 0, "Unknown": 0}
    for s in summaries:
        fb = s.get("summary", {}).get("feedback", "Unknown")
        feedback_counts[fb] = feedback_counts.get(fb, 0) + 1
        st = s.get("summary", {}).get("project_status", "Unknown")
        status_counts[st] = status_counts.get(st, 0) + 1
    html = f'''
    <html>
    <head>
        <meta charset="utf-8">
        <title>AIron Rush Weekly Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 2em; }}
            h1 {{ color: #ff6600; }}
            .rocket {{ font-size: 2em; }}
            table {{ border-collapse: collapse; width: 100%; margin-top: 1em; }}
            th, td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
            th {{ background: #ffe5d0; }}
            .summary-block {{ margin: 1em 0; padding: 1em; background: #fff3e0; border-radius: 8px; }}
        </style>
    </head>
    <body>
        <h1>AIron Rush <span class="rocket">🚀</span> Weekly Summary Report</h1>
        <div class="summary-block">
            <b>User ID:</b> {user_id}<br>
            <b>Total Summaries:</b> {total}<br>
            <b>Feedback:</b> Positive: {feedback_counts['Positive']}, Negative: {feedback_counts['Negative']}, Neutral: {feedback_counts['Neutral']}, Unknown: {feedback_counts['Unknown']}<br>
            <b>Status:</b> on-going: {status_counts['on-going']}, completed: {status_counts['completed']}, pending: {status_counts['pending']}, Unknown: {status_counts['Unknown']}
        </div>
        <table>
            <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Region</th>
                <th>Vertical</th>
                <th>Status</th>
                <th>Feedback</th>
                <th>Summary</th>
            </tr>
            {''.join([
                f'<tr><td>{s.get("created_at", "")[:10]}</td><td>{s.get("summary", {}).get("client_name", "")}</td><td>{s.get("summary", {}).get("client_region", "")}</td><td>{s.get("summary", {}).get("vertical", "")}</td><td>{s.get("summary", {}).get("project_status", "")}</td><td>{s.get("summary", {}).get("feedback", "")}</td><td>{s.get("summary", {}).get("input_summary", "")[:60]}...</td></tr>'
                for s in summaries
            ])}
        </table>
        <div style="margin-top:2em; color:#888; font-size:0.9em;">Generated by AIron Rush on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</div>
    </body>
    </html>
    '''
    return html

@app.get("/openai/weekly-summary-pdf/{user_id}")
def get_weekly_summary_pdf(user_id: str):
    summaries = get_weekly_summaries(user_id)
    html = render_weekly_report_html(user_id, summaries)
    pdf_io = BytesIO()
    HTML(string=html).write_pdf(pdf_io)
    pdf_io.seek(0)
    return StreamingResponse(pdf_io, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=AIronRush_Weekly_Report_{user_id}.pdf"
    })

def generate_market_insights(company_name: str):
    """Generate comprehensive market and industry insights"""
    try:
        if not openai_client:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        prompt = f"""Analyze the market and industry landscape for {company_name} and provide comprehensive insights. 
        
        Please provide a detailed analysis in the following JSON format:

        {{
            "sector_insights": {{
                "BFSI": {{
                    "trends": ["list of 3-4 key trends"],
                    "opportunities": ["list of 3-4 opportunities"],
                    "challenges": ["list of 3-4 challenges"],
                    "key_players": ["list of 4-5 major companies"]
                }},
                "Technology": {{
                    "trends": ["list of 3-4 key trends"],
                    "opportunities": ["list of 3-4 opportunities"],
                    "challenges": ["list of 3-4 challenges"],
                    "key_players": ["list of 4-5 major companies"]
                }},
                "Healthcare": {{
                    "trends": ["list of 3-4 key trends"],
                    "opportunities": ["list of 3-4 opportunities"],
                    "challenges": ["list of 3-4 challenges"],
                    "key_players": ["list of 4-5 major companies"]
                }},
                "Retail": {{
                    "trends": ["list of 3-4 key trends"],
                    "opportunities": ["list of 3-4 opportunities"],
                    "challenges": ["list of 3-4 challenges"],
                    "key_players": ["list of 4-5 major companies"]
                }}
            }},
            "emerging_trends": [
                {{
                    "title": "trend title",
                    "description": "detailed description",
                    "impact": "High/Medium/Low - impact description",
                    "sector": "affected sectors"
                }}
            ],
            "market_opportunities": [
                {{
                    "title": "opportunity title",
                    "description": "detailed description",
                    "potential": "growth potential description",
                    "timeline": "expected timeline"
                }}
            ]
        }}

        Focus on:
        1. Current market dynamics and industry trends
        2. Emerging technologies and their impact
        3. Regulatory changes and their implications
        4. Competitive landscape shifts
        5. Consumer behavior changes
        6. Global economic factors affecting the market
        7. Innovation opportunities and disruptive technologies
        8. Risk factors and market challenges

        Provide actionable insights that would be valuable for sales teams and business development."""
        
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a market intelligence expert with deep knowledge of business trends, industry analysis, and competitive landscapes. Provide comprehensive, data-driven insights that help businesses understand market opportunities and challenges."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            insights = json.loads(content)
            return insights
            
        except json.JSONDecodeError:
            # Return default structure if JSON parsing fails
            return {
                "sector_insights": {
                    "BFSI": {
                        "trends": ["Digital banking transformation", "AI-powered risk assessment", "Sustainable finance initiatives", "Regulatory technology adoption"],
                        "opportunities": ["Fintech partnerships", "Digital payment solutions", "ESG investment products", "Cybersecurity services"],
                        "challenges": ["Regulatory compliance", "Cybersecurity threats", "Low interest rates", "Digital disruption"],
                        "key_players": ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Goldman Sachs", "Morgan Stanley"]
                    },
                    "Technology": {
                        "trends": ["AI/ML adoption", "Cloud migration", "Cybersecurity focus", "Remote work solutions", "Edge computing"],
                        "opportunities": ["SaaS platforms", "AI consulting", "Cybersecurity services", "Digital transformation", "IoT solutions"],
                        "challenges": ["Talent shortage", "Rapid innovation", "Data privacy", "Supply chain issues", "Competition"],
                        "key_players": ["Microsoft", "Google", "Amazon", "Apple", "Meta", "NVIDIA"]
                    },
                    "Healthcare": {
                        "trends": ["Telemedicine growth", "AI diagnostics", "Personalized medicine", "Digital health records", "Wearable technology"],
                        "opportunities": ["Health tech solutions", "Remote monitoring", "AI-powered diagnostics", "Patient engagement", "Preventive care"],
                        "challenges": ["Regulatory hurdles", "Data security", "Integration complexity", "Cost pressures", "Provider adoption"],
                        "key_players": ["UnitedHealth", "Anthem", "Aetna", "Cigna", "Humana", "CVS Health"]
                    },
                    "Retail": {
                        "trends": ["E-commerce growth", "Omnichannel retail", "Personalization", "Sustainability focus", "Social commerce"],
                        "opportunities": ["Digital commerce", "Supply chain optimization", "Customer experience", "Sustainable products", "Mobile commerce"],
                        "challenges": ["Supply chain disruption", "Labor shortages", "Digital transformation", "Competition", "Customer expectations"],
                        "key_players": ["Amazon", "Walmart", "Target", "Costco", "Home Depot", "Best Buy"]
                    }
                },
                "emerging_trends": [
                    {
                        "title": "AI-Powered Business Intelligence",
                        "description": "Advanced analytics and AI-driven insights transforming decision-making processes across industries",
                        "impact": "High - Enabling data-driven strategies and predictive capabilities",
                        "sector": "Cross-sector"
                    },
                    {
                        "title": "Sustainability & ESG Focus",
                        "description": "Growing emphasis on environmental, social, and governance factors in business decisions",
                        "impact": "Medium-High - Driving investment decisions and consumer preferences",
                        "sector": "Cross-sector"
                    },
                    {
                        "title": "Digital Transformation Acceleration",
                        "description": "Rapid adoption of digital technologies across all industries post-pandemic",
                        "impact": "High - Creating new business models and competitive advantages",
                        "sector": "Cross-sector"
                    },
                    {
                        "title": "Supply Chain Resilience",
                        "description": "Focus on building robust and flexible supply chain networks",
                        "impact": "Medium - Addressing global disruptions and ensuring continuity",
                        "sector": "Manufacturing, Retail, Technology"
                    }
                ],
                "market_opportunities": [
                    {
                        "title": "AI Consulting Services",
                        "description": "Help businesses implement and optimize AI solutions for competitive advantage",
                        "potential": "High growth potential with increasing AI adoption across industries",
                        "timeline": "6-18 months"
                    },
                    {
                        "title": "Cybersecurity Solutions",
                        "description": "Address growing security concerns in digital transformation initiatives",
                        "potential": "Strong demand due to increasing cyber threats and regulatory requirements",
                        "timeline": "3-12 months"
                    },
                    {
                        "title": "Sustainability Consulting",
                        "description": "Guide companies in ESG compliance and sustainable business practices",
                        "potential": "Growing market with regulatory pressure and stakeholder demands",
                        "timeline": "12-24 months"
                    },
                    {
                        "title": "Digital Health Platforms",
                        "description": "Telemedicine and remote health monitoring solutions for healthcare providers",
                        "potential": "High growth post-pandemic adoption and regulatory support",
                        "timeline": "6-15 months"
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error generating market insights: {e}")
        return {
            "sector_insights": {},
            "emerging_trends": [],
            "market_opportunities": []
        }

@app.post("/openai/market-insights")
async def get_market_insights(request: dict):
    try:
        company_name = request.get("company_name")
        
        if not company_name:
            raise HTTPException(status_code=400, detail="company_name is required")
            
        print(f"Generating market insights for company: {company_name}")
        
        insights = generate_market_insights(company_name)
        
        return JSONResponse({
            "success": True,
            "insights": insights,
            "message": f"Market insights generated for {company_name}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating market insights: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 