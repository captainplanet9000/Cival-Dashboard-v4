'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Send, 
  Mic, 
  MicOff, 
  Brain, 
  Zap, 
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { elizaNLP, type ElizaCommand, type ElizaResponse } from '@/lib/eliza/natural-language-processor';
import { cn } from '@/lib/utils';

interface TerminalMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  command?: ElizaCommand;
  response?: ElizaResponse;
}

export function ElizaTerminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = elizaNLP.getSuggestions();

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: TerminalMessage = {
      id: 'welcome',
      type: 'assistant',
      content: "🤖 **Eliza AI Trading Assistant** activated! I can help you manage agents, farms, trades, and DeFi operations using natural language. Try saying something like 'start Marcus agent' or 'show portfolio status'.",
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);

    // Initialize Eliza context
    elizaNLP.updateContext({
      user: 'trader',
      portfolio: { totalValue: 125847, totalPnL: 5847 },
      agents: [
        { id: 'marcus', name: 'Marcus', status: 'active' },
        { id: 'alex', name: 'Alex', status: 'active' },
        { id: 'sophia', name: 'Sophia', status: 'paused' }
      ],
      farms: [
        { id: 'farm-1', name: 'DeFi Yield Farm', performance: 12.3 }
      ],
      marketConditions: { trend: 'bullish', volatility: 'medium' }
    });

    // Focus input
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (commandText?: string) => {
    const text = commandText || input.trim();
    if (!text || isProcessing) return;

    const userMessage: TerminalMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setShowSuggestions(false);

    try {
      // Process with Eliza NLP
      const response = await elizaNLP.processCommand(text);
      
      const assistantMessage: TerminalMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        response
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there are suggestions, show them
      if (response.suggestions && response.suggestions.length > 0) {
        setTimeout(() => {
          const suggestionMessage: TerminalMessage = {
            id: `suggestions-${Date.now()}`,
            type: 'system',
            content: `💡 **Quick actions:** ${response.suggestions?.join(' • ')}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, suggestionMessage]);
        }, 1000);
      }

      // If there's a follow-up question, show it
      if (response.followUp) {
        setTimeout(() => {
          const followUpMessage: TerminalMessage = {
            id: `followup-${Date.now()}`,
            type: 'assistant',
            content: `🤔 ${response.followUp}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      }

    } catch (error) {
      const errorMessage: TerminalMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "❌ I encountered an error processing your command. Please try again or rephrase your request.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsProcessing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition (mock implementation)
      setIsListening(true);
      setTimeout(() => {
        setInput("Start Marcus agent with $5000");
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    elizaNLP.clearHistory();
  };

  const getMessageIcon = (message: TerminalMessage) => {
    switch (message.type) {
      case 'user':
        return <Terminal className="h-4 w-4 text-blue-500" />;
      case 'assistant':
        return message.response?.success ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-500" />
            <CardTitle>Eliza AI Terminal</CardTitle>
            <Badge variant="secondary" className="text-green-600">
              <Activity className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={clearTerminal}>
              Clear
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleVoiceInput}
              className={cn(isListening && "bg-red-50 border-red-200")}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-1 text-red-500" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1" />
                  Voice
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start space-x-3",
                message.type === 'user' && "flex-row-reverse space-x-reverse"
              )}
            >
              <div className="flex-shrink-0 mt-1">
                {getMessageIcon(message)}
              </div>
              <div className={cn(
                "flex-1 min-w-0",
                message.type === 'user' && "text-right"
              )}>
                <div className={cn(
                  "inline-block rounded-lg px-4 py-2 max-w-[80%] break-words",
                  message.type === 'user' 
                    ? "bg-blue-500 text-white ml-auto" 
                    : message.type === 'system'
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white shadow-sm border"
                )}>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content.split('**').map((part, index) => 
                      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                    )}
                  </div>
                  {message.response?.data && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <pre>{JSON.stringify(message.response.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Brain className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Eliza is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">💡 **Try these commands:**</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a command... (e.g., 'start Marcus agent' or 'show portfolio status')"
              disabled={isProcessing}
              className="pr-10"
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          <Button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            size="sm"
          >
            {isProcessing ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
          <div className="flex items-center space-x-4">
            <span>Commands: {elizaNLP.getCommandHistory().length}</span>
            <span>•</span>
            <span>Status: Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-3 w-3 text-green-500" />
            <span>AI Enhanced</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}