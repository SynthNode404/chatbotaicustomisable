
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { Message, GeminiChatProps } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, (_match, code) => `<pre class="bg-neutral/20 p-2 rounded-md my-2 overflow-x-auto text-sm"><code>${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="bg-neutral/20 px-1 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};


export const ChatInterface: React.FC<GeminiChatProps> = ({ 
  systemInstruction, 
  temperature,
  topK,
  topP,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isApiInitializing, setIsApiInitializing] = useState<boolean>(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>("Checking API Key...");
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    console.log("ChatInterface: Initializing AI client...");
    const key = process.env.API_KEY;
    
    try {
      if (!key || typeof key !== 'string' || key.trim() === "") {
        let errMessage = "API Key is missing or empty.";
        if (key && typeof key !== 'string') {
          errMessage = "API Key is not a string. Please ensure it's correctly configured.";
          console.error("ChatInterface: API Key is not a string. Value type:", typeof key);
        } else {
          console.error("ChatInterface: API Key is missing or empty.");
        }
        setError(errMessage + " Please set the API_KEY environment variable.");
        setApiKeyStatus("API Key error: " + errMessage);
        aiRef.current = null;
        setIsApiInitializing(false);
        return;
      }

      setApiKeyStatus("API Key found. Initializing AI...");
      console.log("ChatInterface: API Key found and appears valid.");
      aiRef.current = new GoogleGenAI({ apiKey: key });
      console.log("ChatInterface: GoogleGenAI client initialized successfully.");
      setError(null); 
    } catch (e: any) {
      console.error("ChatInterface: Failed to initialize GoogleGenAI client:", e);
      setError(`Failed to initialize Gemini AI Client: ${e.message}. Check API_KEY and console for details.`);
      setApiKeyStatus(`Error initializing AI: ${e.message}`);
      aiRef.current = null;
    }
    setIsApiInitializing(false);
  }, []);
  
  useEffect(() => {
    if (isApiInitializing) {
      console.log("ChatInterface: Still initializing API, skipping chat session creation.");
      return;
    }
    if (!aiRef.current) {
      console.warn("ChatInterface: AI client (aiRef.current) not available. Cannot create chat session.");
      if (!error) { 
          setError("ChatInterface: AI client failed to initialize. Chat session cannot be created. Check API Key configuration.");
      }
      setChatSession(null); 
      return;
    }

    console.log("ChatInterface: Attempting to create/re-initialize chat session with settings:", 
      { systemInstruction, temperature, topK, topP, model: GEMINI_MODEL_NAME });
    try {
      const newChatConfig = {
        model: GEMINI_MODEL_NAME,
        config: { 
          systemInstruction: systemInstruction,
          temperature: temperature,
          topK: topK,
          topP: topP,
        }
      };
      const newChat = aiRef.current.chats.create(newChatConfig);
      setChatSession(newChat);
      setMessages([]); 
      setError(null); 
      console.log("ChatInterface: Chat session created/re-initialized successfully.", newChat);
    } catch (e: any) {
      console.error("ChatInterface: Failed to create chat session:", e);
      setError(`Failed to create chat session: ${e.message}. Ensure model name and parameters are correct. Check console.`);
      setChatSession(null);
    }
  }, [systemInstruction, temperature, topK, topP, aiRef, isApiInitializing, error]); 


  const handleSendMessage = useCallback(async () => {
    console.log("ChatInterface: handleSendMessage called. userInput:", userInput, "isLoading:", isLoading);
    if (!userInput.trim() || isLoading) return;
    
    if (!aiRef.current) {
      console.error("ChatInterface: sendMessage - Gemini AI client not initialized.");
      setError("Gemini AI client not initialized. Check API Key and console for errors.");
      return;
    }
    if (!chatSession) {
      console.error("ChatInterface: sendMessage - Chat session not available.");
      setError("Chat session not available. This might be due to an API key issue or recent settings change. Please wait or check settings. Check console for details.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInput = userInput; 
    setUserInput('');
    setIsLoading(true);
    setError(null);

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prevMessages => [
      ...prevMessages,
      { id: botMessageId, text: '', sender: 'bot', timestamp: new Date(), meta: {isLoading: true, chunks: []} }
    ]);

    console.log("ChatInterface: Sending message to Gemini:", currentInput);
    try {
      const stream = await chatSession.sendMessageStream({ message: currentInput });
      let currentBotText = '';
      let chunksReceived: string[] = [];

      for await (const chunk of stream) {
        const chunkText = chunk.text; 
        if (typeof chunkText === 'string') {
            chunksReceived.push(chunkText);
            currentBotText += chunkText;
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, text: currentBotText, meta: {...msg.meta, chunks: chunksReceived} }
                  : msg
              )
            );
        } else {
            console.warn("ChatInterface: Received chunk without text content:", chunk);
        }
      }
      console.log("ChatInterface: Stream ended. Full bot response:", currentBotText);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === botMessageId
            ? { ...msg, meta: {...msg.meta, isLoading: false} }
            : msg
        )
      );

    } catch (e: any) {
      console.error("ChatInterface: Error sending message or processing stream:", e);
      let errorMessage = `Failed to get response: ${e.message || 'Unknown error'}`;
      if (e.message && e.message.toLowerCase().includes("api key not valid")) {
        errorMessage = "API key not valid. Please check your API_KEY environment variable.";
      } else if (e.message && e.message.toLowerCase().includes("quota")) {
        errorMessage = `API quota exceeded: ${e.message}. Please check your Google AI Studio dashboard.`;
      } else if (e.message && e.message.toLowerCase().includes("model_name")) {
         errorMessage = `Model related error: ${e.message}. The model '${GEMINI_MODEL_NAME}' might be unavailable or configured incorrectly.`;
      }
      setError(errorMessage);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: `Error: ${errorMessage}`, meta: {isLoading: false, isError: true} }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatSession]); 


  const getBubbleClasses = (sender: 'user' | 'bot') => {
    let baseClasses = "max-w-xl p-3 rounded-xl shadow mb-2 break-words";
    if (sender === 'user') {
      return `${baseClasses} bg-primary text-white ml-auto`; 
    } else {
      return `${baseClasses} bg-base-100 dark:bg-neutral text-base-content border border-neutral dark:border-neutral/50`;
    }
  };
  
  const isTextareaDisabled = isLoading || !chatSession || isApiInitializing;
  const isSendButtonDisabled = isTextareaDisabled || !userInput.trim();
  
  let placeholderText = "Type your message...";
  if (isApiInitializing) {
    placeholderText = apiKeyStatus; 
  } else if (!aiRef.current || !chatSession) { // If AI init is done, but we still don't have a client or session
     placeholderText = error || apiKeyStatus || "Chat service unavailable. Check API Key.";
  }


  return (
    <div className="flex flex-col h-full bg-base-100 text-base-content">
      <header className="p-4 border-b border-neutral shadow-sm">
        <h1 className="text-xl font-semibold text-primary">Chat with Gemini</h1>
        {isLoading && messages.some(m => m.meta?.isLoading) && <p className="text-sm text-accent animate-pulse">Bot is thinking...</p>}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-base-100/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={getBubbleClasses(msg.sender)}>
              {msg.meta?.isLoading && msg.sender === 'bot' ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" /> <span>Thinking...</span>
                </div>
              ) : (
                 <MarkdownRenderer content={msg.text} />
              )}
              <div className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && !error && !isApiInitializing && chatSession && (
          <div className="text-center text-neutral-focus p-8">
            <p>Chat history is empty.</p>
            <p>Type a message to start interacting with the bot.</p>
            <p className="text-xs mt-2">Current System Instruction: "{systemInstruction.substring(0, 50)}{systemInstruction.length > 50 ? '...' : ''}"</p>
          </div>
        )}
         {messages.length === 0 && !error && (isApiInitializing || !chatSession) && (
          <div className="text-center text-neutral-focus p-8">
            {isApiInitializing && <><LoadingSpinner /><p className="mt-2">{apiKeyStatus}</p></>}
            {!isApiInitializing && !chatSession && (apiKeyStatus.toLowerCase().includes("api key") || (error && error.toLowerCase().includes("api key"))) &&
              <p className="mt-2 text-red-500">{error || apiKeyStatus}</p>
            }
            {!isApiInitializing && !chatSession && !(apiKeyStatus.toLowerCase().includes("api key") || (error && error.toLowerCase().includes("api key"))) &&
              <><LoadingSpinner /><p className="mt-2">{ error || "Connecting to chat service..."}</p></>
            }
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      
      <div className="p-4 border-t border-neutral bg-base-100">
        <div className="flex items-center space-x-2">
          <textarea
            rows={1}
            className="flex-1 p-3 border border-neutral rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-base-100 text-base-content placeholder-neutral-focus disabled:opacity-70"
            placeholder={placeholderText}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isSendButtonDisabled) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isTextareaDisabled}
            aria-label="Chat input"
          />
          <button
            onClick={handleSendMessage}
            disabled={isSendButtonDisabled}
            className="p-3 bg-primary text-white rounded-lg shadow-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:bg-neutral disabled:text-neutral-focus disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
            aria-disabled={isSendButtonDisabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
