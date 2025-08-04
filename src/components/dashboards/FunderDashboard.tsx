import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Banknote,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface FunderMetrics {
  availableFunds: number;
  pendingFunding: number;
  fundedToday: number;
  avgFundingTime: number;
  totalFundedThisMonth: number;
}

export const FunderDashboard = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FunderMetrics>({
    availableFunds: 5000000, // Mock data
    pendingFunding: 0,
    fundedToday: 0,
    avgFundingTime: 1.2,
    totalFundedThisMonth: 0
  });
  const [pendingFundings, setPendingFundings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunderData();
  }, []);

  const fetchFunderData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Fetch loans ready for funding
      const { data: pendingData } = await supabase
        .from('contact_entities')
        .select('*')
        .eq('stage', 'Closing');

      // Fetch funded loans today
      const { data: fundedToday } = await supabase
        .from('contact_entities')
        .select('loan_amount')
        .eq('stage', 'Loan Funded')
        .gte('updated_at', today);

      // Fetch this month's funded loans
      const { data: monthlyData } = await supabase
        .from('clients')
        .select('total_loan_value')
        .gte('join_date', monthStart);

      setPendingFundings(pendingData || []);
      
      const pendingAmount = pendingData?.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0) || 0;
      const fundedTodayAmount = fundedToday?.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0) || 0;
      const monthlyTotal = monthlyData?.reduce((sum, client) => sum + (client.total_loan_value || 0), 0) || 0;

      setMetrics(prev => ({
        ...prev,
        pendingFunding: pendingAmount,
        fundedToday: fundedTodayAmount,
        totalFundedThisMonth: monthlyTotal
      }));

    } catch (error) {
      console.error('Error fetching funder data:', error);
      toast({
        title: "Error",
        description: "Failed to load funder dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundLoan = async (loanId: string, amount: number) => {
    try {
      await supabase
        .from('leads')
        .update({ 
          stage: 'Loan Funded',
          is_converted_to_client: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      toast({
        title: "Loan Funded",
        description: `Successfully funded ${formatCurrency(amount)}`,
      });
      
      fetchFunderData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fund loan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading funder dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-card/60 to-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funder Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage loan funding and capital allocation</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.availableFunds)}</div>
            <p className="text-xs text-muted-foreground">Ready for deployment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Funding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.pendingFunding)}</div>
            <p className="text-xs text-muted-foreground">Awaiting funding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funded Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.fundedToday)}</div>
            <p className="text-xs text-muted-foreground">Loans funded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Funding Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgFundingTime} days</div>
            <p className="text-xs text-muted-foreground">Average time to fund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalFundedThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Total funded</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Funding</TabsTrigger>
          <TabsTrigger value="portfolio">Funding Portfolio</TabsTrigger>
          <TabsTrigger value="analytics">Funding Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loans Ready for Funding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFundings.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{loan.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(loan.loan_amount || 0)} • {loan.loan_type || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{loan.stage}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Interest Rate: {loan.interest_rate || 'N/A'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleFundLoan(loan.id, loan.loan_amount || 0)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Fund Loan
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingFundings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No loans pending funding
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funding Portfolio Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalFundedThisMonth)}</div>
                  <div className="text-sm text-muted-foreground">Deployed Capital</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.availableFunds)}</div>
                  <div className="text-sm text-muted-foreground">Available Capital</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">8.5%</div>
                  <div className="text-sm text-muted-foreground">Avg. Return Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funding Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Funding Velocity</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average time from approval to funding: {metrics.avgFundingTime} days
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Capital Efficiency</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((metrics.totalFundedThisMonth / (metrics.availableFunds + metrics.totalFundedThisMonth)) * 100)}% capital deployed this month
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};