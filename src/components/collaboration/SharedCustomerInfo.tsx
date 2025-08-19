import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Building,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  History,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Edit,
  Share2
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface CustomerInfo {
  id: string;
  name: string;
  business_name?: string;
  email: string;
  phone: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip_code?: string;
  loan_amount?: number;
  loan_type?: string;
  stage: string;
  priority: string;
  credit_score?: number;
  annual_revenue?: number;
  year_established?: number;
  created_at: string;
  updated_at: string;
  processor_name?: string;
  bdo_name?: string;
  existing_loans?: ExistingLoan[];
  interaction_history?: Interaction[];
  documents?: Document[];
}

interface ExistingLoan {
  id: string;
  loan_amount: number;
  loan_type: string;
  interest_rate?: number;
  maturity_date?: string;
  status: string;
  funded_date?: string;
}

interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'document' | 'stage_change';
  description: string;
  user_name: string;
  department: string;
  timestamp: string;
  outcome?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  department: string;
}

interface SharedCustomerInfoProps {
  customerId: string;
  onClose?: () => void;
}

export function SharedCustomerInfo({ customerId, onClose }: SharedCustomerInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomerInfo();
    }
  }, [customerId]);

  const fetchCustomerInfo = async () => {
    try {
      // Fetch customer basic info
      const { data: contactData, error: contactError } = await supabase
        .from('contact_entities')
        .select('*')
        .eq('id', customerId)
        .single();

      if (contactError) throw contactError;

      // Fetch existing loans from clients table
      const { data: clientData } = await supabase
        .from('clients')
        .select(`
          *,
          loans(
            id,
            loan_amount,
            loan_type,
            interest_rate,
            maturity_date,
            status,
            created_at
          )
        `)
        .eq('contact_entity_id', customerId);

      // Mock interaction history (would be from actual tables)
      const mockInteractions: Interaction[] = [
        {
          id: '1',
          type: 'call',
          description: 'Initial consultation call - discussed SBA loan options',
          user_name: 'Sarah Johnson',
          department: 'Sales',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'Interested in $500K SBA loan'
        },
        {
          id: '2',
          type: 'document',
          description: 'Financial statements uploaded and reviewed',
          user_name: 'Emily Rodriguez',
          department: 'Processing',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'Documents complete, moved to underwriting'
        },
        {
          id: '3',
          type: 'stage_change',
          description: 'Application moved to underwriting review',
          user_name: 'Mike Chen',
          department: 'Underwriting',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'Pending additional documentation'
        }
      ];

      // Mock documents (would be from actual documents table)
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Financial Statements 2023',
          type: 'Financial',
          uploaded_by: 'Customer',
          uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          department: 'Processing'
        },
        {
          id: '2',
          name: 'Tax Returns 2022-2023',
          type: 'Tax Documents',
          uploaded_by: 'Customer',
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          department: 'Processing'
        },
        {
          id: '3',
          name: 'Bank Statements (6 months)',
          type: 'Banking',
          uploaded_by: 'Customer',
          uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          department: 'Underwriting'
        }
      ];

      const transformedCustomer: CustomerInfo = {
        ...contactData,
        existing_loans: clientData?.[0]?.loans || [],
        interaction_history: mockInteractions,
        documents: mockDocuments
      };

      setCustomer(transformedCustomer);
    } catch (error) {
      console.error('Error fetching customer info:', error);
      toast({
        title: "Error",
        description: "Failed to load customer information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New Lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Initial Contact': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'Application': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pre-approval': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Documentation': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Underwriting': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closing': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Funded': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'document': return FileText;
      case 'stage_change': return Target;
      default: return MessageSquare;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading customer information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Customer not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{customer.name}</h2>
                {customer.business_name && (
                  <p className="text-muted-foreground">{customer.business_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStageColor(customer.stage)}>
                    {customer.stage}
                  </Badge>
                  <Badge className={getPriorityColor(customer.priority)}>
                    {customer.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Save' : 'Edit'}
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Existing Loans</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
                {customer.business_address && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Business Address</label>
                    <p className="font-medium">
                      {customer.business_address}
                      {customer.business_city && `, ${customer.business_city}`}
                      {customer.business_state && `, ${customer.business_state}`}
                      {customer.business_zip_code && ` ${customer.business_zip_code}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {customer.annual_revenue && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Annual Revenue</label>
                      <p className="font-medium">{formatCurrency(customer.annual_revenue)}</p>
                    </div>
                  )}
                  {customer.year_established && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Year Established</label>
                      <p className="font-medium">{customer.year_established}</p>
                    </div>
                  )}
                  {customer.credit_score && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Credit Score</label>
                      <p className="font-medium">{customer.credit_score}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Loan Request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Current Loan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {customer.loan_amount && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Requested Amount</label>
                      <p className="font-medium text-lg">{formatCurrency(customer.loan_amount)}</p>
                    </div>
                  )}
                  {customer.loan_type && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Loan Type</label>
                      <p className="font-medium">{customer.loan_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Team Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {customer.processor_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Loan Processor</span>
                      <Badge variant="outline">{customer.processor_name}</Badge>
                    </div>
                  )}
                  {customer.bdo_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Underwriter</span>
                      <Badge variant="outline">{customer.bdo_name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Existing Loans ({customer.existing_loans?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.existing_loans && customer.existing_loans.length > 0 ? (
                <div className="space-y-4">
                  {customer.existing_loans.map(loan => (
                    <div key={loan.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{loan.loan_type}</h4>
                        <Badge variant="outline" className={getStageColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium">{formatCurrency(loan.loan_amount)}</span>
                        </div>
                        {loan.interest_rate && (
                          <div>
                            <span className="text-muted-foreground">Rate: </span>
                            <span className="font-medium">{loan.interest_rate}%</span>
                          </div>
                        )}
                        {loan.funded_date && (
                          <div>
                            <span className="text-muted-foreground">Funded: </span>
                            <span className="font-medium">{format(new Date(loan.funded_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        {loan.maturity_date && (
                          <div>
                            <span className="text-muted-foreground">Maturity: </span>
                            <span className="font-medium">{format(new Date(loan.maturity_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No existing loans found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Interaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {customer.interaction_history?.map(interaction => {
                    const IconComponent = getInteractionIcon(interaction.type);
                    return (
                      <div key={interaction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{interaction.user_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {interaction.department}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{interaction.description}</p>
                          {interaction.outcome && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Outcome: {interaction.outcome}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({customer.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.documents?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} • Uploaded by {doc.uploaded_by} • {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.department}
                      </Badge>
                      <Badge className={`text-xs ${getDocumentStatusColor(doc.status)}`}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!customer.documents || customer.documents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Team Notes & Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team communication history will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}