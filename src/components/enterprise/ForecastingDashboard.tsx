import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, TrendingUp, Calendar, Target, BarChart3 } from "lucide-react";

interface ForecastPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: string;
  status: string;
  created_at: string;
}

interface Forecast {
  id: string;
  period_id: string;
  user_id: string;
  territory_id: string;
  methodology: string;
  amount: number;
  quota: number;
  confidence_level: number;
  notes: string;
  submitted_at: string;
  created_at: string;
}

export function ForecastingDashboard() {
  const [periods, setPeriods] = useState<ForecastPeriod[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const { toast } = useToast();

  const [periodForm, setPeriodForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    period_type: "quarterly"
  });

  const [forecastForm, setForecastForm] = useState({
    methodology: "most_likely",
    amount: "",
    quota: "",
    confidence_level: "80",
    notes: ""
  });

  const periodTypes = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" }
  ];

  const methodologies = [
    { value: "best_case", label: "Best Case" },
    { value: "most_likely", label: "Most Likely" },
    { value: "worst_case", label: "Worst Case" },
    { value: "commit", label: "Commit" }
  ];

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchForecasts(selectedPeriod);
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('forecast_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
      
      // Auto-select the first period if available
      if (data && data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forecast periods",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchForecasts = async (periodId: string) => {
    try {
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .eq('period_id', periodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForecasts(data || []);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forecasts",
        variant: "destructive"
      });
    }
  };

  const handleCreatePeriod = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forecast_periods')
        .insert({
          name: periodForm.name,
          start_date: periodForm.start_date,
          end_date: periodForm.end_date,
          period_type: periodForm.period_type,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast period created successfully"
      });

      setShowPeriodDialog(false);
      resetPeriodForm();
      fetchPeriods();
    } catch (error) {
      console.error('Error creating period:', error);
      toast({
        title: "Error",
        description: "Failed to create forecast period",
        variant: "destructive"
      });
    }
  };

  const handleCreateForecast = async () => {
    if (!selectedPeriod) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forecasts')
        .insert({
          period_id: selectedPeriod,
          user_id: user.id,
          methodology: forecastForm.methodology,
          amount: parseFloat(forecastForm.amount),
          quota: forecastForm.quota ? parseFloat(forecastForm.quota) : null,
          confidence_level: parseInt(forecastForm.confidence_level),
          notes: forecastForm.notes
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast submitted successfully"
      });

      setShowForecastDialog(false);
      resetForecastForm();
      fetchForecasts(selectedPeriod);
    } catch (error) {
      console.error('Error creating forecast:', error);
      toast({
        title: "Error",
        description: "Failed to submit forecast",
        variant: "destructive"
      });
    }
  };

  const resetPeriodForm = () => {
    setPeriodForm({
      name: "",
      start_date: "",
      end_date: "",
      period_type: "quarterly"
    });
  };

  const resetForecastForm = () => {
    setForecastForm({
      methodology: "most_likely",
      amount: "",
      quota: "",
      confidence_level: "80",
      notes: ""
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      submitted: "secondary",
      approved: "outline",
      closed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getMethodologyColor = (methodology: string) => {
    const colors: Record<string, string> = {
      best_case: "text-green-600",
      most_likely: "text-blue-600",
      worst_case: "text-red-600",
      commit: "text-purple-600"
    };
    return colors[methodology] || "text-gray-600";
  };

  const calculateTotals = () => {
    return forecasts.reduce((acc, forecast) => {
      acc[forecast.methodology] = (acc[forecast.methodology] || 0) + forecast.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Forecasting</h2>
          <p className="text-muted-foreground">
            Advanced sales forecasting with multiple methodologies
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Forecast Period</DialogTitle>
                <DialogDescription>
                  Define a new forecasting period
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="period-name">Period Name</Label>
                  <Input
                    id="period-name"
                    value={periodForm.name}
                    onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                    placeholder="e.g., Q1 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={periodForm.start_date}
                      onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={periodForm.end_date}
                      onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="period-type">Period Type</Label>
                  <Select
                    value={periodForm.period_type}
                    onValueChange={(value) => setPeriodForm({ ...periodForm, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePeriod} className="w-full">
                  Create Period
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {selectedPeriod && (
            <Dialog open={showForecastDialog} onOpenChange={setShowForecastDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Forecast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Forecast</DialogTitle>
                  <DialogDescription>
                    Submit your forecast for the selected period
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="methodology">Methodology</Label>
                    <Select
                      value={forecastForm.methodology}
                      onValueChange={(value) => setForecastForm({ ...forecastForm, methodology: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {methodologies.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Forecast Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={forecastForm.amount}
                        onChange={(e) => setForecastForm({ ...forecastForm, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quota">Quota (Optional)</Label>
                      <Input
                        id="quota"
                        type="number"
                        value={forecastForm.quota}
                        onChange={(e) => setForecastForm({ ...forecastForm, quota: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence Level (%)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="100"
                      value={forecastForm.confidence_level}
                      onChange={(e) => setForecastForm({ ...forecastForm, confidence_level: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={forecastForm.notes}
                      onChange={(e) => setForecastForm({ ...forecastForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <Button onClick={handleCreateForecast} className="w-full">
                    Submit Forecast
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            Forecast Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {periods.map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriod === period.id ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period.id)}
                className="flex items-center gap-2"
              >
                {period.name}
                {getStatusBadge(period.status)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPeriod && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {methodologies.map((method) => (
              <Card key={method.value}>
                <CardHeader className="pb-2">
                  <CardDescription className={getMethodologyColor(method.value)}>
                    {method.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {formatCurrency(totals[method.value] || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {forecasts.filter(f => f.methodology === method.value).length} forecasts
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Forecasts Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Forecast Details
              </CardTitle>
              <CardDescription>
                Individual forecasts for {periods.find(p => p.id === selectedPeriod)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Methodology</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="font-mono text-sm">
                        {forecast.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getMethodologyColor(forecast.methodology)}
                        >
                          {methodologies.find(m => m.value === forecast.methodology)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(forecast.amount)}
                      </TableCell>
                      <TableCell>
                        {forecast.quota ? formatCurrency(forecast.quota) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${forecast.confidence_level}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{forecast.confidence_level}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {forecast.submitted_at 
                          ? new Date(forecast.submitted_at).toLocaleDateString()
                          : 'Draft'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}