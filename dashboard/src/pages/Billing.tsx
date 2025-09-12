import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { apiCall, API_BASE_URL } from "@/utils/api";
import { CreditCard, Download, Check, Zap, Users, Database, Clock, Loader2 } from 'lucide-react';

export function Billing() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // Load all billing data in parallel using the API utility
      const [plansData, subscriptionData, usageData, invoicesData] = await Promise.allSettled([
        apiCall('/billing/plans'),
        apiCall('/billing/subscription'),
        apiCall('/billing/usage'),
        apiCall('/billing/invoices')
      ]);

      if (plansData.status === 'fulfilled') {
        setPlans(plansData.value);
      }

      if (subscriptionData.status === 'fulfilled') {
        setSubscription(subscriptionData.value);
      }

      if (usageData.status === 'fulfilled') {
        setUsage(usageData.value);
      }

      if (invoicesData.status === 'fulfilled') {
        setInvoices(invoicesData.value);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (planId: string) => {
    setIsUpdating(true);
    try {
      const updatedSubscription = await apiCall('/billing/subscription', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });

      setSubscription(updatedSubscription);
      toast({
        title: "Success",
        description: "Subscription updated successfully"
      });
      loadBillingData(); // Refresh data
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsUpdating(true);
    try {
      const updatedSubscription = await apiCall('/billing/subscription/cancel', {
        method: 'POST'
      });

      setSubscription(updatedSubscription);
      toast({
        title: "Success",
        description: "Subscription will be canceled at the end of the billing period"
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading billing information...</span>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button className="bg-primary hover:bg-primary-hover">
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment
            </Button>
          </div>
        </div>

        {/* Current Plan */}
        {subscription ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-primary" />
                    Current Plan: {subscription.plan?.displayName || 'No Plan'}
                  </CardTitle>
                  <CardDescription>
                    ${formatPrice(subscription.plan?.price || 0)}/{subscription.plan?.interval || 'month'} • 
                    Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Database className="mr-1 h-4 w-4" />
                      Connections
                    </span>
                    <span>
                      {usage.connections || 0}/
                      {subscription.plan?.limits?.maxConnections === -1 ? '∞' : subscription.plan?.limits?.maxConnections || 0}
                    </span>
                  </div>
                  <Progress value={getUsagePercentage(usage.connections || 0, subscription.plan?.limits?.maxConnections || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Zap className="mr-1 h-4 w-4" />
                      Queries
                    </span>
                    <span>
                      {(usage.queries || 0).toLocaleString()}/
                      {subscription.plan?.limits?.maxQueries === -1 ? '∞' : (subscription.plan?.limits?.maxQueries || 0).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={getUsagePercentage(usage.queries || 0, subscription.plan?.limits?.maxQueries || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      Team Members
                    </span>
                    <span>
                      {usage.team_members || 0}/
                      {subscription.plan?.limits?.maxTeamMembers === -1 ? '∞' : subscription.plan?.limits?.maxTeamMembers || 0}
                    </span>
                  </div>
                  <Progress value={getUsagePercentage(usage.team_members || 0, subscription.plan?.limits?.maxTeamMembers || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      API Calls
                    </span>
                    <span>
                      {(usage.api_calls || 0).toLocaleString()}/
                      {subscription.plan?.limits?.maxApiCalls === -1 ? '∞' : (subscription.plan?.limits?.maxApiCalls || 0).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={getUsagePercentage(usage.api_calls || 0, subscription.plan?.limits?.maxApiCalls || 0)} />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Next billing amount</p>
                  <p className="text-2xl font-bold">${formatPrice(subscription.plan?.price || 0)}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={isUpdating || subscription.cancelAtPeriodEnd}
                  >
                    {subscription.cancelAtPeriodEnd ? 'Canceling at Period End' : 'Cancel Subscription'}
                  </Button>
                  <Button disabled={isUpdating}>Upgrade Plan</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">Choose a plan to get started with Celabyte</p>
              <Button onClick={() => plans.length > 0 && handlePlanChange(plans[0].id)}>
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Available Plans */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Choose the plan that best fits your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => {
                    const isCurrentPlan = subscription?.plan?.id === plan.id;
                    const isPopular = plan.name === 'growth'; // Growth plan is most popular
                    
                    return (
                      <div
                        key={plan.id}
                        className={`relative p-6 border rounded-lg ${
                          isPopular ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        {isPopular && (
                          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                            Most Popular
                          </Badge>
                        )}
                        
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">{plan.displayName}</h3>
                          <div className="mt-2">
                            <span className="text-3xl font-bold">
                              {plan.price === 0 ? 'Custom' : `$${formatPrice(plan.price)}`}
                            </span>
                            <span className="text-muted-foreground">/{plan.interval}</span>
                          </div>
                        </div>
                        
                        <ul className="mt-6 space-y-2">
                          {Object.entries(plan.features as any).map(([key, value], index) => (
                            <li key={index} className="flex items-center text-sm">
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              <span>
                                {key === 'connections' && `${value === 'unlimited' ? 'Unlimited' : value} database connections`}
                                {key === 'queries' && `${value === 'unlimited' ? 'Unlimited' : value} queries per month`}
                                {key === 'teamMembers' && `Up to ${value} team members`}
                                {key === 'support' && `${value} support`}
                                {key === 'apiAccess' && value && 'API access'}
                                {key === 'phoneSupport' && value && 'Phone support'}
                                {key === 'onPremise' && value && 'On-premise deployment'}
                                {key === 'customIntegrations' && value && 'Custom integrations'}
                                {key === 'dedicatedSupport' && value && 'Dedicated support team'}
                                {key === 'customTraining' && value && 'Custom training'}
                                {key === 'slaGuarantees' && value && 'SLA guarantees'}
                                {key === 'advancedSecurity' && value && 'Advanced security controls'}
                                {key === 'customDevelopment' && value && 'Custom development'}
                              </span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          className={`w-full mt-6 ${
                            isCurrentPlan
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-primary hover:bg-primary-hover'
                          }`}
                          disabled={isCurrentPlan || isUpdating}
                          onClick={() => !isCurrentPlan && handlePlanChange(plan.id)}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isCurrentPlan ? 'Current Plan' : 
                           plan.name === 'enterprise' ? 'Contact Sales' : 
                           `Upgrade to ${plan.displayName}`}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Your recent invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{invoice.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${formatPrice(invoice.amount)}</p>
                          <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No invoices yet</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    View All Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Your current payment information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="p-2 bg-primary/10 rounded">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/25</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add Payment Method
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

export default Billing;