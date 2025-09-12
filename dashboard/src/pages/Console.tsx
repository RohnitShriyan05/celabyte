import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Clock, Database, Download, History, MessageSquare, Play, Server, Plus, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiCall, API_BASE_URL } from "@/utils/api";

const sampleQueries = [
  "Show me the top 10 customers by revenue",
  "Get average order value for the last 7 days",
  "Find all users who signed up this month",
  "Show product performance by category",
  "List all tables in the database",
  "Show me recent orders with customer details"
];

interface QueryResult {
  tool: string | null;
  target?: string;
  rows?: number;
  data: any;
  answer: string;
  provider?: string;
  timestamp?: string;
  duration?: number;
}

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  duration: number;
  rows?: number;
  status: 'success' | 'error';
  error?: string;
}

interface DatabaseConnection {
  id: string;
  name: string;
  kind: 'POSTGRES' | 'MYSQL' | 'MONGODB' | 'EXCEL';
  displayName: string;
  status: 'connected' | 'error';
  readOnly: boolean;
}

export function Console() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  
  // Chat state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatMode, setIsChatMode] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Load query history, connections, and conversations on component mount
  useEffect(() => {
    loadConnections();
    if (isChatMode) {
      loadConversations();
    } else {
      loadQueryHistory();
    }
  }, [isChatMode]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadConnections = async () => {
    try {
      const data = await apiCall('/connections');
      setConnections(data);
      // Auto-select all connected databases
      const connectedIds = data.filter((conn: DatabaseConnection) => conn.status === 'connected').map((conn: DatabaseConnection) => conn.id);
      setSelectedConnections(connectedIds);
    } catch (err) {
      toast({
        title: "Couldn't load databases",
        description: "Something went wrong while loading your databases. Please check your internet connection or try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await apiCall('/chat');
      setConversations(data.conversations || []);
    } catch (err) {
      toast({
        title: "Couldn't load conversations",
        description: "We couldn't load your chat history. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiCall(`/chat/${conversationId}/messages`);
      setMessages(data.messages || []);
      setCurrentConversation(data.conversation);
    } catch (err) {
      toast({
        title: "Couldn't load chat",
        description: "We couldn't load your conversation. Please try again or start a new chat.",
        variant: "destructive"
      });
    }
  };

  const loadQueryHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/queries/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const history = await response.json();
        setQueryHistory(history.slice(0, 10)); // Show last 10 queries
      }
    } catch (err) {
      toast({
        title: "Couldn't load query history",
        description: "We couldn't load your recent queries. Please refresh the page or try again later.",
        variant: "destructive"
      });
    }
  };

  const createNewChat = async () => {
    try {
      const data = await apiCall('/chat', {
        method: 'POST',
        body: JSON.stringify({
          title: newChatTitle || 'New Chat'
        })
      });
      
      const newConversation = data.conversation;
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
      setIsChatMode(true);
      setNewChatTitle('');
      
      toast({
        title: "New chat created",
        description: "You can now start chatting with your data"
      });
    } catch (err: any) {
      toast({
        title: "Couldn't create chat",
        description: "We couldn't start a new chat. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async () => {
    if (!query.trim() || !currentConversation) return;

    if (selectedConnections.length === 0) {
      toast({
        title: "No databases selected",
        description: "Please select at least one database to query",
        variant: "destructive"
      });
      return;
    }

    const userMessage = query;
    setQuery('');
    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const data = await apiCall(`/chat/${currentConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          provider: provider
        })
      });

      // Remove temp message and add real messages
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      
      // Add both user and assistant messages
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'ASSISTANT',
        content: data.result.answer,
        metadata: data.result,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, 
        { ...tempUserMessage, id: `user-${Date.now()}` },
        assistantMessage
      ]);

      // Update conversation in list
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, updatedAt: new Date().toISOString() }
          : conv
      ));

    } catch (err: any) {
      setError("Sorry, we couldn't send your message. Please check your connection or try again.");
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      toast({
        title: "Message not sent",
        description: "Sorry, we couldn't send your message. Please check your connection or try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunQuery = async () => {
    if (isChatMode && currentConversation) {
      return sendChatMessage();
    }

    if (!query.trim()) return;

    if (selectedConnections.length === 0) {
      toast({
        title: "No databases selected",
        description: "Please select at least one database to query",
        variant: "destructive"
      });
      return;
    }

  setIsLoading(true);
  setError(null);
  setResults(null);

    const startTime = Date.now();

    try {
      // Build enhanced context for better AI responses
      const selectedDbs = connections.filter(conn => selectedConnections.includes(conn.id));
      const contextInfo = {
        availableDatabases: selectedDbs.map(db => ({
          name: db.displayName,
          type: db.kind,
          id: db.id
        })),
        databaseTypes: [...new Set(selectedDbs.map(db => db.kind))],
        totalDatabases: selectedDbs.length
      };

      const enhancedMessage = `Context: I have access to ${contextInfo.totalDatabases} database(s) of types: ${contextInfo.databaseTypes.join(', ')}. Available databases: ${contextInfo.availableDatabases.map(db => `${db.name} (${db.type})`).join(', ')}.

User Query: ${query}

Please provide a specific, actionable response. If you need more information about table structures or column names, ask specific questions about which database and table you should examine.`;

      const data = await apiCall('/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: enhancedMessage,
          provider: provider,
          selectedConnections: selectedConnections
        })
      });

      // Fixed: Check if we have a valid response with answer property
      if (data && data.answer !== undefined) {
        setResults(data);
        const historyItem: QueryHistoryItem = {
          id: Date.now().toString(),
          query: query.substring(0, 100),
          timestamp: new Date().toLocaleString(),
          duration: data.duration || (Date.now() - startTime),
          rows: data.rows,
          status: 'success' as const
        };
        setQueryHistory(prev => [historyItem, ...prev.slice(0, 9)]);

        // Record usage for billing
        try {
          await apiCall('/billing/usage', {
            method: 'POST',
            body: JSON.stringify({
              metric: 'QUERIES',
              quantity: 1,
              metadata: {
                provider: provider,
                executionTime: Date.now() - startTime,
                queryLength: query.length
              }
            })
          });
        } catch (usageError) {
          console.warn('Failed to record usage:', usageError);
          // Don't fail the query if usage recording fails
        }
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const errorMessage = "Sorry, we couldn't process your request. Please check your question or try again in a few moments.";
      setError(errorMessage);
      // Add error to history
      const historyItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query: query.substring(0, 100),
        timestamp: new Date().toLocaleString(),
        duration: Date.now() - startTime,
        status: 'error',
        error: errorMessage
      };
      setQueryHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      toast({
        title: "Query couldn't run",
        description: "Sorry, we couldn't process your request. Please check your question or try again in a few moments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (!results?.data) return;

    const csvContent = convertToCSV(results.data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]): string => {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const handleConnectionToggle = (connectionId: string) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const selectAllConnections = () => {
    const connectedIds = connections.filter(conn => conn.status === 'connected').map(conn => conn.id);
    setSelectedConnections(connectedIds);
  };

  const clearAllConnections = () => {
    setSelectedConnections([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isChatMode ? 'AI Chat Console' : 'Query Console'}
            </h1>
            <p className="text-muted-foreground">
              {isChatMode ? 'Have conversations with your data' : 'Chat with your database using natural language'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={isChatMode ? "default" : "outline"} 
              onClick={() => setIsChatMode(!isChatMode)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {isChatMode ? 'Chat Mode' : 'Single Query'}
            </Button>
            <Select value={provider} onValueChange={(value: 'gemini' | 'openai') => setProvider(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini AI</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={isChatMode ? loadConversations : loadQueryHistory}>
              <History className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Database Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Database Selection
            </CardTitle>
            <CardDescription>
              Select which databases to query ({selectedConnections.length} of {connections.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConnections ? (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading databases...</span>
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-4">
                <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No databases configured</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add Database
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllConnections}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllConnections}>
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConnections.includes(connection.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-secondary/50'
                      } ${connection.status === 'error' ? 'opacity-50' : ''}`}
                      onClick={() => connection.status === 'connected' && handleConnectionToggle(connection.id)}
                    >
                      <Checkbox
                        checked={selectedConnections.includes(connection.id)}
                        disabled={connection.status !== 'connected'}
                        onChange={() => handleConnectionToggle(connection.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm truncate">{connection.displayName}</span>
                          <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                            {connection.kind}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {connection.status === 'connected' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {connection.status === 'connected' ? 'Connected' : 'Error'}
                          </span>
                          {connection.readOnly && (
                            <Badge variant="secondary" className="text-xs">Read-only</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isChatMode ? (
          /* Chat Interface */
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Chat Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Conversations</CardTitle>
                    <Button size="sm" onClick={createNewChat}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentConversation?.id === conv.id
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setCurrentConversation(conv)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{conv.title}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete conversation logic here
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No conversations yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Messages */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>
                    {currentConversation ? currentConversation.title : 'Select a conversation'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {currentConversation ? (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'USER'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.metadata && message.role === 'ASSISTANT' && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <div className="text-xs text-muted-foreground">
                                    {message.metadata.rows && `${message.metadata.rows} rows • `}
                                    {message.metadata.duration}ms
                                    {message.metadata.tool && ` • ${message.metadata.tool}`}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-secondary p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 animate-spin" />
                                <span className="text-sm">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Ask about your data..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          className="min-h-16 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleRunQuery();
                            }
                          }}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Press Enter to send, Shift+Enter for new line
                          </span>
                          <Button 
                            onClick={handleRunQuery}
                            disabled={!query.trim() || isLoading}
                            size="sm"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">Start a conversation</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a new chat or select an existing conversation
                        </p>
                        <Button onClick={createNewChat}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Chat
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Single Query Interface */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Query Input */}
            <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Query Editor
                </CardTitle>
                <CardDescription>
                  Type your question in plain English or write SQL directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ask me anything about your data... e.g., 'Show me top customers by revenue'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-32 resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {sampleQueries.slice(0, 2).map((sample, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(sample)}
                        className="text-xs"
                      >
                        {sample}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    onClick={handleRunQuery}
                    disabled={!query.trim() || isLoading}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isLoading ? 'Running...' : 'Run Query'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {results && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Query Results
                      {results.tool && (
                        <Badge variant="secondary">{results.tool}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {results.rows ? `${results.rows} rows` : 'No data'} returned in {results.duration || 0}ms
                      {results.provider && ` using ${results.provider}`}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* AI Answer */}
                  {results.answer && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">AI Analysis:</h4>
                      <p className="text-sm text-muted-foreground">{results.answer}</p>
                    </div>
                  )}

                  {/* Data Table */}
                  {Array.isArray(results.data) && results.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(results.data[0]).map((header) => (
                              <th key={header} className="text-left p-2 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.data.map((row, index) => (
                            <tr key={index} className="border-b hover:bg-secondary/50">
                              {Object.entries(row).map(([key, value]) => (
                                <td key={key} className="p-2">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : results.data ? (
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(results.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No data returned</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Examples</CardTitle>
                <CardDescription>Try these sample queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleQueries.map((sample, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuery(sample)}
                      className="w-full justify-start text-left h-auto p-3 whitespace-normal"
                    >
                      {sample}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Queries</CardTitle>
                <CardDescription>Your query history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {queryHistory.length > 0 ? (
                    queryHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                        onClick={() => setQuery(item.query)}
                      >
                        <div className="text-sm font-mono text-muted-foreground truncate">
                          {item.query}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex space-x-2">
                            {item.status === 'success' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {item.duration}ms
                            </Badge>
                            {item.rows !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {item.rows} rows
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-500 mt-1 truncate">
                            {item.error}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No query history yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Console;