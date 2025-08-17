import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Handshake, 
  Building2, 
  DollarSign, 
  Clock,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Send,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Download,
  Upload,
  Globe,
  Shield,
  Zap,
  MessageSquare,
  Bell,
  Eye,
  Share2,
  Plus,
  Settings,
  BarChart3,
  Target
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BankPartner {
  id: string;
  name: string;
  type: 'sba_lender' | 'commercial_bank' | 'credit_union' | 'private_lender';
  logo?: string;
  status: 'active' | 'inactive' | 'pending';
  connectionStrength: number;
  totalFunded: number;
  avgFundingTime: number;
  preferredLoanTypes: string[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  apiIntegration: boolean;
  webhookUrl?: string;
  lastActivity: string;
}

interface LoanRequiringFunding {
  id: string;
  clientName: string;
  businessName: string;
  loanAmount: number;
  loanType: string;
  creditScore: number;
  timeInBusiness: number;
  annualRevenue: number;
  stage: string;
  urgency: 'low' | 'medium' | 'high';
  submittedAt: string;
  matchedPartners: string[];
  documents: string[];
  collateral?: string;
}

interface FundingRequest {
  id: string;
  loanId: string;
  partnerId: string;
  partnerName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'funded';
  submittedAt: string;
  responseTime?: string;
  terms?: {
    interestRate: number;
    term: number;
    fees: number;
  };
  comments?: string;
}

interface PartnerActivity {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'funding_request' | 'response' | 'integration' | 'communication';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export function BankPartnerCollaboration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('partners');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Mock data - would be replaced with real data
  const [bankPartners] = useState<BankPartner[]>([
    {
      id: '1',
      name: 'First National SBA',
      type: 'sba_lender',
      status: 'active',
      connectionStrength: 95,
      totalFunded: 45000000,
      avgFundingTime: 12,
      preferredLoanTypes: ['SBA 7(a)', 'SBA 504', 'Working Capital'],
      contactInfo: {
        name: 'Sarah Mitchell',
        email: 'sarah.mitchell@firstnationalsba.com',
        phone: '(555) 123-4567',
        title: 'VP Business Development'
      },
      apiIntegration: true,
      webhookUrl: 'https://api.firstnationalsba.com/webhook',
      lastActivity: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Capital Growth Bank',
      type: 'commercial_bank',
      status: 'active',
      connectionStrength: 87,
      totalFunded: 32000000,
      avgFundingTime: 18,
      preferredLoanTypes: ['Commercial Real Estate', 'Equipment Financing', 'LOC'],
      contactInfo: {
        name: 'Michael Chen',
        email: 'mchen@capitalgrowth.com',
        phone: '(555) 234-5678',
        title: 'Senior Loan Officer'
      },
      apiIntegration: false,
      lastActivity: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      name: 'Community Business Credit Union',
      type: 'credit_union',
      status: 'active',
      connectionStrength: 78,
      totalFunded: 18500000,
      avgFundingTime: 15,
      preferredLoanTypes: ['Small Business', 'Microloans', 'Startup Funding'],
      contactInfo: {
        name: 'Lisa Rodriguez',
        email: 'l.rodriguez@cbcu.org',
        phone: '(555) 345-6789',
        title: 'Business Lending Manager'
      },
      apiIntegration: true,
      webhookUrl: 'https://api.cbcu.org/loan-requests',
      lastActivity: '2024-01-15T11:45:00Z'
    }
  ]);

  const [loansRequiringFunding] = useState<LoanRequiringFunding[]>([
    {
      id: '1',
      clientName: 'John Smith',
      businessName: 'Tech Solutions Inc',
      loanAmount: 250000,
      loanType: 'SBA 7(a)',
      creditScore: 745,
      timeInBusiness: 5,
      annualRevenue: 850000,
      stage: 'Closing',
      urgency: 'high',
      submittedAt: '2024-01-15T09:00:00Z',
      matchedPartners: ['First National SBA', 'Capital Growth Bank'],
      documents: ['Application', 'Financials', 'Tax Returns', 'Business Plan'],
      collateral: 'Equipment and Inventory'
    },
    {
      id: '2',
      clientName: 'Maria Gonzalez',
      businessName: 'Green Earth Manufacturing',
      loanAmount: 500000,
      loanType: 'Equipment Financing',
      creditScore: 698,
      timeInBusiness: 8,
      annualRevenue: 1200000,
      stage: 'Closing',
      urgency: 'medium',
      submittedAt: '2024-01-14T14:30:00Z',
      matchedPartners: ['Capital Growth Bank', 'Community Business Credit Union'],
      documents: ['Application', 'Financials', 'Equipment Quotes']
    }
  ]);

  const [fundingRequests] = useState<FundingRequest[]>([
    {
      id: '1',
      loanId: '1',
      partnerId: '1',
      partnerName: 'First National SBA',
      status: 'approved',
      submittedAt: '2024-01-15T09:30:00Z',
      responseTime: '2024-01-15T11:15:00Z',
      terms: {
        interestRate: 6.75,
        term: 120,
        fees: 2500
      },
      comments: 'Excellent credit profile. Ready to fund upon final documentation.'
    },
    {
      id: '2',
      loanId: '1',
      partnerId: '2',
      partnerName: 'Capital Growth Bank',
      status: 'reviewing',
      submittedAt: '2024-01-15T09:45:00Z'
    }
  ]);

  const [partnerActivity] = useState<PartnerActivity[]>([
    {
      id: '1',
      partnerId: '1',
      partnerName: 'First National SBA',
      type: 'response',
      description: 'Approved funding for Tech Solutions Inc - $250K',
      timestamp: '2024-01-15T11:15:00Z',
      status: 'success'
    },
    {
      id: '2',
      partnerId: '3',
      partnerName: 'Community Business Credit Union',
      type: 'integration',
      description: 'API integration successfully established',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success'
    }
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSendFundingRequest = async (loanId: string, partnerId: string) => {
    const partner = bankPartners.find(p => p.id === partnerId);
    
    if (partner?.apiIntegration && partner.webhookUrl) {
      // Send via API integration
      setIsTestingWebhook(true);
      try {
        const loan = loansRequiringFunding.find(l => l.id === loanId);
        
        const response = await fetch(partner.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            loanId,
            clientName: loan?.clientName,
            businessName: loan?.businessName,
            loanAmount: loan?.loanAmount,
            loanType: loan?.loanType,
            creditScore: loan?.creditScore,
            timestamp: new Date().toISOString(),
            source: 'CRM_System'
          }),
        });

        toast({
          title: "Funding Request Sent",
          description: `Request sent to ${partner.name} via API integration`,
        });
      } catch (error) {
        toast({
          title: "API Integration Error",
          description: "Failed to send via API. Falling back to manual process.",
          variant: "destructive",
        });
      } finally {
        setIsTestingWebhook(false);
      }
    } else {
      // Manual process
      toast({
        title: "Funding Request Initiated",
        description: `Manual funding request process started with ${partner?.name}`,
      });
    }
  };

  const handleTestZapierWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          eventType: 'loan_ready_for_funding',
          loanId: 'test_123',
          clientName: 'Test Client',
          loanAmount: 100000,
          loanType: 'SBA 7(a)',
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      toast({
        title: "Webhook Test Sent",
        description: "Test notification sent to your Zapier workflow. Check your Zap history to confirm.",
      });
    } catch (error) {
      toast({
        title: "Webhook Test Failed",
        description: "Failed to send test webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'funded': case 'active': return 'bg-green-500';
      case 'reviewing': case 'pending': return 'bg-yellow-500';
      case 'rejected': case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300';
    }
  };

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'sba_lender': return Building2;
      case 'commercial_bank': return DollarSign;
      case 'credit_union': return Users;
      case 'private_lender': return Handshake;
      default: return Building2;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading partner collaboration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank & Partner Collaboration</h2>
          <p className="text-muted-foreground">Manage funding partnerships and loan submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Integration Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{bankPartners.filter(p => p.status === 'active').length}</p>
              </div>
              <Handshake className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Funded</p>
                <p className="text-2xl font-bold">${(bankPartners.reduce((sum, p) => sum + p.totalFunded, 0) / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Funding Time</p>
                <p className="text-2xl font-bold">{Math.round(bankPartners.reduce((sum, p) => sum + p.avgFundingTime, 0) / bankPartners.length)} days</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready for Funding</p>
                <p className="text-2xl font-bold">{loansRequiringFunding.length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="partners">Bank Partners</TabsTrigger>
          <TabsTrigger value="funding">Ready for Funding</TabsTrigger>
          <TabsTrigger value="requests">Funding Requests</TabsTrigger>
          <TabsTrigger value="activity">Partner Activity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bankPartners.map(partner => {
              const PartnerIcon = getPartnerTypeIcon(partner.type);
              return (
                <Card key={partner.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <PartnerIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{partner.name}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">{partner.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(partner.status)}`}></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Connection Strength</span>
                        <span className="font-medium">{partner.connectionStrength}%</span>
                      </div>
                      <Progress value={partner.connectionStrength} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Funded</span>
                          <p className="font-medium">${(partner.totalFunded / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Time</span>
                          <p className="font-medium">{partner.avgFundingTime} days</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Preferred Loan Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {partner.preferredLoanTypes.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {partner.apiIntegration && (
                            <Badge variant="default" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              API Integrated
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="text-sm">
                          <p className="font-medium">{partner.contactInfo.name}</p>
                          <p className="text-muted-foreground">{partner.contactInfo.title}</p>
                          <p className="text-muted-foreground">{partner.contactInfo.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="funding" className="space-y-6">
          <div className="space-y-4">
            {loansRequiringFunding.map(loan => (
              <Card key={loan.id} className={`border-l-4 ${getUrgencyColor(loan.urgency)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="font-semibold text-lg">{loan.businessName}</h3>
                        <p className="text-muted-foreground">{loan.clientName}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Loan Amount</span>
                          <p className="font-medium">${loan.loanAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type</span>
                          <p className="font-medium">{loan.loanType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credit Score</span>
                          <p className="font-medium">{loan.creditScore}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Annual Revenue</span>
                          <p className="font-medium">${loan.annualRevenue.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{loan.stage}</Badge>
                        <Badge variant={loan.urgency === 'high' ? 'destructive' : loan.urgency === 'medium' ? 'default' : 'secondary'}>
                          {loan.urgency} urgency
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Submitted {formatDistanceToNow(new Date(loan.submittedAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Documents Ready:</p>
                        <div className="flex flex-wrap gap-1">
                          {loan.documents.map(doc => (
                            <Badge key={doc} variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Matched Partners:</p>
                        <div className="flex flex-wrap gap-2">
                          {loan.matchedPartners.map(partnerName => {
                            const partner = bankPartners.find(p => p.name === partnerName);
                            return (
                              <div key={partnerName} className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSendFundingRequest(loan.id, partner?.id || '')}
                                  disabled={isTestingWebhook}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send to {partnerName}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="space-y-4">
            {fundingRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{request.partnerName}</h3>
                        <Badge variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'reviewing' ? 'secondary' :
                          request.status === 'rejected' ? 'destructive' : 'outline'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Submitted</span>
                          <p className="font-medium">{formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}</p>
                        </div>
                        {request.responseTime && (
                          <div>
                            <span className="text-muted-foreground">Response Time</span>
                            <p className="font-medium">
                              {Math.round((new Date(request.responseTime).getTime() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60))} hours
                            </p>
                          </div>
                        )}
                        {request.terms && (
                          <div>
                            <span className="text-muted-foreground">Interest Rate</span>
                            <p className="font-medium">{request.terms.interestRate}%</p>
                          </div>
                        )}
                      </div>

                      {request.terms && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <h4 className="font-medium text-green-800 mb-2">Approved Terms</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-700">Rate:</span>
                              <p className="font-medium">{request.terms.interestRate}%</p>
                            </div>
                            <div>
                              <span className="text-green-700">Term:</span>
                              <p className="font-medium">{request.terms.term} months</p>
                            </div>
                            <div>
                              <span className="text-green-700">Fees:</span>
                              <p className="font-medium">${request.terms.fees.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {request.comments && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">{request.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Partner Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {partnerActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(activity.status)}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.partnerName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        <Badge variant="outline" className="text-xs mt-2">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Zapier Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your CRM to external systems when loans are ready for funding.
                </p>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Zapier Webhook URL</label>
                  <Input
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button 
                    onClick={handleTestZapierWebhook}
                    disabled={isTestingWebhook}
                    className="w-full"
                  >
                    {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {bankPartners.filter(p => p.apiIntegration).map(partner => (
                    <div key={partner.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{partner.name}</h4>
                        <p className="text-sm text-muted-foreground">Real-time loan submissions</p>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Integration
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{bankPartners.filter(p => p.apiIntegration).length}</div>
                  <p className="text-sm text-muted-foreground">API Integrations</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">98%</div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2.3s</div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}