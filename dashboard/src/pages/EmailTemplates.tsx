import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Eye, Send, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/utils/api';
import { DashboardLayout } from '@/components/DashboardLayout';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

const defaultTemplate: TemplateFormData = {
  name: '',
  subject: '',
  content: '',
  variables: [],
  isActive: true
};

const commonVariables = [
  'name', 'email', 'company', 'country', 'state', 'city', 
  'industry', 'jobTitle', 'leadSource', 'phone'
];

const templateExamples = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to {{company}} - Let\'s Connect!',
    content: `
<p>Hi {{name}},</p>

<p>I hope this email finds you well. My name is [Your Name] and I'm reaching out from {{company}}.</p>

<p>I noticed you're working as {{jobTitle}} in the {{industry}} industry, and I believe our solutions could be valuable for your business.</p>

<p>Would you be available for a brief 15-minute call this week to discuss how we can help {{company}} achieve its goals?</p>

<p>Best regards,<br>[Your Name]</p>
    `.trim(),
    variables: ['name', 'company', 'jobTitle', 'industry']
  },
  followup: {
    name: 'Follow-up Email',
    subject: 'Following up on our conversation - {{company}}',
    content: `
<p>Hi {{name}},</p>

<p>I wanted to follow up on our previous conversation about how we can help {{company}} grow.</p>

<p>Based on your role as {{jobTitle}}, I believe you'd be particularly interested in our latest features that are specifically designed for the {{industry}} sector.</p>

<p>Would you like to schedule a demo to see these in action?</p>

<p>Best regards,<br>[Your Name]</p>
    `.trim(),
    variables: ['name', 'company', 'jobTitle', 'industry']
  },
  holiday: {
    name: 'Holiday Greetings',
    subject: 'Season\'s Greetings from {{company}}',
    content: `
<p>Dear {{name}},</p>

<p>As we approach the holiday season, I wanted to reach out and wish you and the team at {{company}} a wonderful time.</p>

<p>It's been great connecting with professionals like you in {{country}}, and I'm excited about the opportunities ahead in the {{industry}} industry.</p>

<p>Wishing you success in the new year!</p>

<p>Warm regards,<br>[Your Name]</p>
    `.trim(),
    variables: ['name', 'company', 'country', 'industry']
  }
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>(defaultTemplate);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState({
    name: 'John Doe',
    company: 'Acme Corp',
    country: 'United States',
    industry: 'Technology',
    jobTitle: 'CEO',
    email: 'john@acme.com'
  });

  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/email-templates');
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      const endpoint = editingTemplate 
        ? `/email-templates/${editingTemplate.id}` 
        : '/email-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      toast({
        title: 'Success',
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
      });

      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive'
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await apiCall(`/email-templates/${templateId}`, {
        method: 'DELETE'
      });

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const cloneTemplate = async (template: EmailTemplate) => {
    try {
      await apiCall(`/email-templates/${template.id}/clone`, {
        method: 'POST',
        body: JSON.stringify({
          newName: `${template.name} (Copy)`
        })
      });

      toast({
        title: 'Success',
        description: 'Template cloned successfully',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone template',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData(defaultTemplate);
    setEditingTemplate(null);
    setShowForm(false);
    setPreviewMode(false);
  };

  const editTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const loadTemplateExample = (exampleKey: keyof typeof templateExamples) => {
    const example = templateExamples[exampleKey];
    setFormData({
      ...formData,
      ...example
    });
  };

  const addVariable = (variable: string) => {
    if (!formData.variables.includes(variable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variable]
      });
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const previewTemplate = (template: EmailTemplate) => {
    let previewSubject = template.subject;
    let previewContent = template.content;

    // Replace variables with preview data
    template.variables.forEach(variable => {
      const value = previewData[variable as keyof typeof previewData] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewContent = previewContent.replace(regex, value);
    });

    return { subject: previewSubject, content: previewContent };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Email Templates</h1>
            <p className="text-gray-600 text-sm sm:text-base">Create and manage email templates for your campaigns</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Template
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</CardTitle>
                <CardDescription>Create a new email template with personalization variables</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                {previewMode && <TabsTrigger value="preview">Preview</TabsTrigger>}
              </TabsList>

              <TabsContent value="edit" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Active Template</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Hello {{name}}, let's connect!"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Email Content (HTML)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your email content here. Use {{variableName}} for personalization."
                    className="min-h-[300px]"
                  />
                </div>

                <div>
                  <Label>Template Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonVariables.map(variable => (
                      <Button
                        key={variable}
                        size="sm"
                        variant="outline"
                        onClick={() => addVariable(variable)}
                        className="h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {variable}
                      </Button>
                    ))}
                  </div>
                  
                  {formData.variables.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.variables.map(variable => (
                        <Badge key={variable} variant="secondary" className="px-2 py-1">
                          {variable}
                          <button
                            onClick={() => removeVariable(variable)}
                            className="ml-2 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveTemplate}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingTemplate ? 'Update Template' : 'Save Template'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(templateExamples).map(([key, example]) => (
                    <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{example.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Subject: {example.subject}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => loadTemplateExample(key as keyof typeof templateExamples)}
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {example.content.substring(0, 150)}...
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {example.variables.map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {previewMode && (
                <TabsContent value="preview" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      This is how your email will look with sample data. Variables will be replaced with actual lead data when sent.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="border-b pb-2 mb-4">
                      <strong>Subject:</strong> {previewTemplate({ ...editingTemplate, ...formData } as EmailTemplate).subject}
                    </div>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewTemplate({ ...editingTemplate, ...formData } as EmailTemplate).content.replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading templates...
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No templates found. Create your first template to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={template.subject}>
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cloneTemplate(template)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
