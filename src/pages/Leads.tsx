import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail,
  DollarSign,
  Target,
  Activity,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadsList } from '@/components/leads/LeadsList';
import { LeadForm } from '@/components/leads/LeadForm';

interface LeadsOverview {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  totalValue: number;
  conversionRate: number;
  responseTime: number;
  followUpsDue: number;
}

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overview, setOverview] = useState<LeadsOverview>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    totalValue: 0,
    conversionRate: 0,
    responseTime: 2.4,
    followUpsDue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadsOverview();
  }, [user]);

  const fetchLeadsOverview = async () => {
    try {
      setLoading(true);
      
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entities(loan_amount, stage, priority)
        `)
        .eq('user_id', user?.id);

      if (!leadsError && leads) {
        const totalLeads = leads.length;
        const newLeads = leads.filter(lead => 
          lead.contact_entities?.stage === 'New Lead'
        ).length;
        const qualifiedLeads = leads.filter(lead => 
          lead.contact_entities?.stage === 'Qualified'
        ).length;
        const hotLeads = leads.filter(lead => 
          lead.contact_entities?.priority === 'high'
        ).length;
        const totalValue = leads.reduce((sum, lead) => 
          sum + (lead.contact_entities?.loan_amount || 0), 0
        );
        const convertedLeads = leads.filter(lead => 
          lead.contact_entities?.stage === 'Loan Funded'
        ).length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        setOverview(prev => ({
          ...prev,
          totalLeads,
          newLeads,
          qualifiedLeads,
          hotLeads,
          totalValue,
          conversionRate,
          followUpsDue: Math.floor(totalLeads * 0.15)
        }));
      }
    } catch (error) {
      console.error('Error fetching leads overview:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Lead Management Center</h1>
          </div>
          <Button onClick={() => setShowNewLeadForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Lead
          </Button>
        </div>

        {/* Leads Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-5 h-5" />
                    <p className="text-lg font-bold">{overview.totalLeads}</p>
                  </div>
                </div>
                <Badge variant="default">
                  MANAGED
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Leads</p>
                  <p className="text-2xl font-bold text-primary">{overview.newLeads}</p>
                </div>
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hot Prospects</p>
                  <p className="text-2xl font-bold text-primary">{overview.hotLeads}</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(overview.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        {overview.followUpsDue > 0 && (
          <Alert className="border-secondary">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {overview.followUpsDue} leads requiring follow-up attention.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active Leads</TabsTrigger>
            <TabsTrigger value="qualified">Qualified</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
            <TabsTrigger value="management">Lead Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <LeadsList />
          </TabsContent>

          <TabsContent value="qualified" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Qualified Prospects
                </CardTitle>
                <CardDescription>
                  Leads that have been qualified and are ready for advanced nurturing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="text-sm font-medium">Ready for Proposal</span>
                    <span className="font-bold text-green-600">{overview.qualifiedLeads}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="text-sm font-medium">High Priority</span>
                    <span className="font-bold text-orange-600">{overview.hotLeads}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="font-bold text-blue-600">{overview.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Conversion Metrics
                  </CardTitle>
                  <CardDescription>
                    Lead conversion and performance tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">{overview.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Response Time</span>
                      <span className="font-semibold">{overview.responseTime}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lead Quality Score</span>
                      <span className="font-semibold text-green-600">8.2/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Activity Overview
                  </CardTitle>
                  <CardDescription>
                    Lead engagement and interaction metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Calls Made</span>
                      <span className="font-semibold">127</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Emails Sent</span>
                      <span className="font-semibold">284</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Meetings Scheduled</span>
                      <span className="font-semibold text-blue-600">18</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-500" />
                    Call Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Make calls and track communication</p>
                  <Button className="w-full">Launch Dialer</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Email Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Send targeted email sequences</p>
                  <Button className="w-full" variant="outline">Create Campaign</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Lead Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Automatic lead qualification</p>
                  <Button className="w-full" variant="outline">Configure Rules</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {showNewLeadForm && (
          <LeadForm 
            onClose={() => setShowNewLeadForm(false)} 
            onSuccess={() => {
              setShowNewLeadForm(false);
              fetchLeadsOverview();
            }}
          />
        )}
      </div>
    </Layout>
  );
}