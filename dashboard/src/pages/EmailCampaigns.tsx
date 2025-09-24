import React, { useState, useEffect } from 'react';
import { Send, Bot, Mail, TrendingUp, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
}

interface EmailLog {
  id: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt?: string;
  errorMsg?: string;
  lead: {
    name: string;
    email: string;
    company?: string;
  };
  template?: {
    name: string;
  };
  createdAt: string;
}

interface EmailAnalytics {
  summary: {
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    successRate: number;
  };
  templateStats: Array<{
    templateId: string;
    templateName: string;
    _count: number;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    sent: number;
    failed: number;
  }>;
}

interface CampaignResult {
  message: string;
  criteria: string;
  totalLeads: number;
  sent: number;
  failed: number;
  results: Array<{
    leadId: string;
    email: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

const criteriaExamples = [
  "Send to all people in India",
  "Send to all CEOs and CTOs",
  "Send to all leads from technology companies",
  "Send to all new leads from last month",
  "Send to all uncontacted leads in the United States",
  "Send to all leads in the healthcare industry",
  "Send to all leads from companies with 'software' in the name"
];

export default function EmailCampaignsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Campaign form state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [criteria, setCriteria] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);

  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates?isActive=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/email-campaigns/logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/email-campaigns/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const sendEmailCampaign = async () => {
    if (!selectedTemplate || !criteria) {
      toast({
        title: 'Missing Information',
        description: 'Please select a template and enter criteria',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    setCampaignResult(null);

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const templateName = template?.name;

      const response = await fetch('/api/email-campaigns/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName,
          criteria,
          testMode
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }

      const result = await response.json();
      setCampaignResult(result);

      if (testMode) {
        toast({
          title: 'Test Mode Results',
          description: `Found ${result.matchedLeads || result.totalLeads} matching leads`,
        });
      } else {
        toast({
          title: 'Campaign Sent',
          description: `Successfully sent ${result.sent} emails, ${result.failed} failed`,
        });
        fetchLogs();
        fetchAnalytics();
      }

    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Campaign Failed',
        description: error instanceof Error ? error.message : 'Failed to send campaign',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'BOUNCED': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'BOUNCED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
    fetchAnalytics();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-gray-600">Send AI-powered email campaigns to your leads</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalEmails.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent Successfully</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.sentEmails.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.failedEmails.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.successRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Campaign</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI-Powered Email Campaign
              </CardTitle>
              <CardDescription>
                Use natural language to describe which leads should receive your email. Our AI will interpret your criteria and find matching leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an email template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="criteria">Campaign Criteria</Label>
                <Textarea
                  id="criteria"
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="e.g., Send to all people in India with the template named 'festive'"
                  className="min-h-[100px]"
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Example criteria:</p>
                  <div className="flex flex-wrap gap-2">
                    {criteriaExamples.map((example, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => setCriteria(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
                <Label>Test Mode (Preview matching leads without sending emails)</Label>
              </div>

              <Button 
                onClick={sendEmailCampaign} 
                disabled={sending || !selectedTemplate || !criteria}
                className="w-full"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {testMode ? 'Test Campaign' : 'Send Campaign'}
                  </>
                )}
              </Button>

              {campaignResult && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{campaignResult.message}</p>
                      <p><strong>Criteria:</strong> {campaignResult.criteria}</p>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{campaignResult.totalLeads}</div>
                          <div className="text-sm text-gray-600">Total Leads</div>
                        </div>
                        {!testMode && (
                          <>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{campaignResult.sent}</div>
                              <div className="text-sm text-gray-600">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{campaignResult.failed}</div>
                              <div className="text-sm text-gray-600">Failed</div>
                            </div>
                          </>
                        )}
                      </div>
                      {testMode && campaignResult.totalLeads > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            ✓ Found {campaignResult.totalLeads} matching leads. Turn off test mode to send emails.
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Logs</CardTitle>
              <CardDescription>Track the status of your sent emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No email logs found. Send your first campaign to see logs here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <Badge className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.lead.name}</div>
                              <div className="text-sm text-gray-600">{log.lead.email}</div>
                              {log.lead.company && (
                                <div className="text-xs text-gray-500">{log.lead.company}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate" title={log.subject}>
                            {log.subject}
                          </TableCell>
                          <TableCell>
                            {log.template ? (
                              <Badge variant="outline">{log.template.name}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            {log.errorMsg ? (
                              <span className="text-red-600 text-sm" title={log.errorMsg}>
                                {log.errorMsg.substring(0, 50)}...
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4">
            {/* Template Performance */}
            {analytics?.templateStats && analytics.templateStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Template Performance</CardTitle>
                  <CardDescription>Most used email templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.templateStats.map((stat, index) => (
                      <div key={stat.templateId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{stat.templateName}</div>
                            <div className="text-sm text-gray-600">{stat._count} emails sent</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(stat._count / (analytics.templateStats[0]?._count || 1)) * 100} 
                            className="w-24"
                          />
                          <span className="text-sm font-medium">{stat._count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Stats */}
            {analytics?.dailyStats && analytics.dailyStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Email Activity</CardTitle>
                  <CardDescription>Email sending activity over the past 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.dailyStats.slice(0, 10).map((stat) => (
                      <div key={stat.date} className="flex items-center justify-between p-2 border rounded">
                        <div className="font-medium">
                          {new Date(stat.date).toLocaleDateString()}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">✓ {stat.sent} sent</span>
                          <span className="text-red-600">✗ {stat.failed} failed</span>
                          <span className="font-medium">{stat.total} total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
