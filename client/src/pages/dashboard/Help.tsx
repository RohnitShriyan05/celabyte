import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, Book, Video, FileText, Send, ExternalLink } from 'lucide-react';

const faqData = [
  {
    id: '1',
    question: 'How do I connect my database?',
    answer: 'To connect your database, go to Database Connections and click "Add Database". Choose your database type (PostgreSQL, MySQL, MongoDB, or Excel/Sheets) and follow the step-by-step setup guide. We recommend creating a read-only user for security.',
    category: 'Getting Started'
  },
  {
    id: '2',
    question: 'What types of queries can I run?',
    answer: 'You can run any SELECT query using natural language or SQL. Our AI translates your questions into optimized database queries. For example, try "Show me top customers by revenue" or "Get users who signed up last month".',
    category: 'Queries'
  },
  {
    id: '3',
    question: 'Is my data secure?',
    answer: 'Yes, we take security seriously. All connections use TLS encryption, we recommend read-only access, and we never store your actual data - only query results temporarily for display. Enable 2FA and use IP whitelisting for additional security.',
    category: 'Security'
  },
  {
    id: '4',
    question: 'How does the AI query translation work?',
    answer: 'Our AI analyzes your database schema and translates natural language questions into SQL queries. It understands table relationships, column names, and common query patterns to generate accurate results.',
    category: 'AI Features'
  },
  {
    id: '5',
    question: 'Can I export query results?',
    answer: 'Yes, you can export query results in multiple formats including CSV, JSON, and Excel. Look for the export button in the query results panel.',
    category: 'Data Export'
  },
  {
    id: '6',
    question: 'How do I manage team permissions?',
    answer: 'Go to Team Management to invite members and assign roles. Admins have full access, Editors can run and save queries, and Viewers have read-only access to existing queries.',
    category: 'Team Management'
  }
];

const quickLinks = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    icon: Book,
    href: '#'
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides',
    icon: Video,
    href: '#'
  },
  {
    title: 'API Documentation',
    description: 'Integrate with our REST API',
    icon: FileText,
    href: '#'
  },
  {
    title: 'Community Forum',
    description: 'Connect with other users',
    icon: MessageCircle,
    href: '#'
  }
];

const supportArticles = [
  {
    title: 'Setting up PostgreSQL connection',
    category: 'Database Setup',
    readTime: '3 min read',
    popular: true
  },
  {
    title: 'Understanding query limits and billing',
    category: 'Billing',
    readTime: '2 min read',
    popular: true
  },
  {
    title: 'Advanced SQL query examples',
    category: 'Queries',
    readTime: '5 min read',
    popular: false
  },
  {
    title: 'Troubleshooting connection issues',
    category: 'Troubleshooting',
    readTime: '4 min read',
    popular: true
  },
  {
    title: 'Setting up team permissions',
    category: 'Team Management',
    readTime: '3 min read',
    popular: false
  }
];

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const filteredFAQ = faqData.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Card key={link.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{link.title}</h3>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* FAQ */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to the most common questions about DBChat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex flex-col items-start">
                          <span>{faq.question}</span>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {faq.category}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                {filteredFAQ.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No results found for "{searchQuery}". Try different keywords or contact support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Brief description of your issue" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button className="bg-primary hover:bg-primary-hover">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="mailto:support@dbchat.com">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Email Us
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Articles */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Articles</CardTitle>
                <CardDescription>Most viewed help articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportArticles.map((article, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{article.title}</h4>
                        {article.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{article.readTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support Info */}
            <Card>
              <CardHeader>
                <CardTitle>Support Information</CardTitle>
                <CardDescription>Get help when you need it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary">Priority Support</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pro and Enterprise users get priority support with faster response times.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Response Time (Free):</span>
                    <span className="font-medium">48-72 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time (Pro):</span>
                    <span className="font-medium">12-24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time (Enterprise):</span>
                    <span className="font-medium">2-4 hours</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a href="#" target="_blank">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Live Chat
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Help;