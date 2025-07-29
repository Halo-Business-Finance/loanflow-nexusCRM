import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts"
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface ForecastData {
  period: string
  projected: number
  actual?: number
  confidence: number
  pipeline: number
}

interface ForecastMetrics {
  currentQuarter: {
    projected: number
    actual: number
    confidence: number
    trend: 'up' | 'down' | 'stable'
  }
  nextQuarter: {
    projected: number
    confidence: number
    pipeline: number
  }
  accuracy: {
    last30Days: number
    last90Days: number
    lastYear: number
  }
}

const mockForecastData: ForecastData[] = [
  { period: "Jan", projected: 125000, actual: 118000, confidence: 85, pipeline: 200000 },
  { period: "Feb", projected: 140000, actual: 145000, confidence: 88, pipeline: 220000 },
  { period: "Mar", projected: 160000, actual: 155000, confidence: 82, pipeline: 240000 },
  { period: "Apr", projected: 175000, actual: 180000, confidence: 90, pipeline: 280000 },
  { period: "May", projected: 190000, actual: 185000, confidence: 87, pipeline: 300000 },
  { period: "Jun", projected: 210000, confidence: 84, pipeline: 320000 },
  { period: "Jul", projected: 225000, confidence: 81, pipeline: 340000 },
  { period: "Aug", projected: 240000, confidence: 78, pipeline: 360000 },
  { period: "Sep", projected: 255000, confidence: 75, pipeline: 380000 },
]

const mockMetrics: ForecastMetrics = {
  currentQuarter: {
    projected: 545000,
    actual: 510000,
    confidence: 85,
    trend: 'up'
  },
  nextQuarter: {
    projected: 720000,
    confidence: 78,
    pipeline: 1060000
  },
  accuracy: {
    last30Days: 92,
    last90Days: 88,
    lastYear: 85
  }
}

export function RevenueForecast() {
  const [forecastData, setForecastData] = useState<ForecastData[]>(mockForecastData)
  const [metrics, setMetrics] = useState<ForecastMetrics>(mockMetrics)
  const [timeframe, setTimeframe] = useState("quarterly")
  const [activeTab, setActiveTab] = useState("forecast")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateForecast = async () => {
    setLoading(true)
    toast({
      title: "Generating Forecast",
      description: "AI is analyzing pipeline data and market trends..."
    })
    
    // Simulate AI processing
    setTimeout(() => {
      toast({
        title: "Forecast Updated",
        description: "Revenue forecast has been recalculated with latest data"
      })
      setLoading(false)
    }, 2000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800"
    if (confidence >= 60) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />
      default: return <Target className="w-4 h-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Forecasting</h2>
          <p className="text-muted-foreground">
            AI-powered revenue predictions based on pipeline analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateForecast} disabled={loading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Update Forecast
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Quarter</CardTitle>
            {getTrendIcon(metrics.currentQuarter.trend)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.currentQuarter.projected)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Actual: {formatCurrency(metrics.currentQuarter.actual)}</span>
              <Badge className={getConfidenceBadge(metrics.currentQuarter.confidence)}>
                {metrics.currentQuarter.confidence}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Quarter</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.nextQuarter.projected)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Pipeline: {formatCurrency(metrics.nextQuarter.pipeline)}</span>
              <Badge className={getConfidenceBadge(metrics.nextQuarter.confidence)}>
                {metrics.nextQuarter.confidence}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.accuracy.last90Days}%</div>
            <p className="text-xs text-muted-foreground">
              Last 90 days accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1060000)}</div>
            <p className="text-xs text-muted-foreground">
              Total pipeline opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast vs Actual</CardTitle>
              <CardDescription>
                Projected revenue compared to actual performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Projected"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="Actual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline vs Forecast</CardTitle>
              <CardDescription>
                Pipeline value contributing to revenue forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="pipeline" fill="#8884d8" name="Pipeline" />
                  <Bar dataKey="projected" fill="#82ca9d" name="Projected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">30 Days</CardTitle>
                <CardDescription>Recent accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.accuracy.last30Days}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Excellent short-term accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">90 Days</CardTitle>
                <CardDescription>Quarterly accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.accuracy.last90Days}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Good medium-term accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1 Year</CardTitle>
                <CardDescription>Annual accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics.accuracy.lastYear}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Solid long-term accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Intervals</CardTitle>
              <CardDescription>
                Forecast confidence over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Confidence']} />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}