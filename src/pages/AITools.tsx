import { useState } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LeadScoring } from "@/components/ai/LeadScoring"
import { RevenueForecast } from "@/components/analytics/RevenueForecast"
import { PredictiveAnalytics } from "@/components/ai/PredictiveAnalytics"
import { WorkflowAutomation } from "@/components/ai/WorkflowAutomation"
import { useToast } from "@/hooks/use-toast"
import { Target, TrendingUp, BarChart3, Bot, Power, Settings } from "lucide-react"

export default function AITools() {
  const [activeTab, setActiveTab] = useState("lead-scoring")
  const { toast } = useToast()
  
  // State for each AI tool
  const [aiToolsEnabled, setAiToolsEnabled] = useState({
    leadScoring: true,
    forecasting: true,
    analytics: false,
    automation: true
  })

  const handleToolToggle = (toolKey: keyof typeof aiToolsEnabled, toolName: string) => {
    setAiToolsEnabled(prev => ({
      ...prev,
      [toolKey]: !prev[toolKey]
    }))
    
    toast({
      title: !aiToolsEnabled[toolKey] ? "AI Tool Enabled" : "AI Tool Disabled",
      description: `${toolName} has been ${!aiToolsEnabled[toolKey] ? 'enabled' : 'disabled'}`,
    })
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Tools</h1>
            <p className="text-muted-foreground">
              AI-powered tools to enhance your CRM workflows and decision-making
            </p>
          </div>
        </div>

        {/* AI Tools Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Power className="w-5 h-5" />
              <span>AI Tools Control Panel</span>
            </CardTitle>
            <CardDescription>
              Enable or disable individual AI tools to customize your CRM experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Lead Scoring Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="lead-scoring-switch" className="font-medium">Lead Scoring</Label>
                    <p className="text-sm text-muted-foreground">AI-powered lead prioritization</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Switch
                    id="lead-scoring-switch"
                    checked={aiToolsEnabled.leadScoring}
                    onCheckedChange={() => handleToolToggle('leadScoring', 'Lead Scoring')}
                  />
                  <Badge variant={aiToolsEnabled.leadScoring ? "default" : "secondary"}>
                    {aiToolsEnabled.leadScoring ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* Revenue Forecasting Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="forecasting-switch" className="font-medium">Revenue Forecast</Label>
                    <p className="text-sm text-muted-foreground">Predict future revenue</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Switch
                    id="forecasting-switch"
                    checked={aiToolsEnabled.forecasting}
                    onCheckedChange={() => handleToolToggle('forecasting', 'Revenue Forecasting')}
                  />
                  <Badge variant={aiToolsEnabled.forecasting ? "default" : "secondary"}>
                    {aiToolsEnabled.forecasting ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* Predictive Analytics Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="analytics-switch" className="font-medium">Predictive Analytics</Label>
                    <p className="text-sm text-muted-foreground">AI insights & recommendations</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Switch
                    id="analytics-switch"
                    checked={aiToolsEnabled.analytics}
                    onCheckedChange={() => handleToolToggle('analytics', 'Predictive Analytics')}
                  />
                  <Badge variant={aiToolsEnabled.analytics ? "default" : "secondary"}>
                    {aiToolsEnabled.analytics ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* Workflow Automation Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="automation-switch" className="font-medium">Automation</Label>
                    <p className="text-sm text-muted-foreground">Automate workflows & tasks</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Switch
                    id="automation-switch"
                    checked={aiToolsEnabled.automation}
                    onCheckedChange={() => handleToolToggle('automation', 'Workflow Automation')}
                  />
                  <Badge variant={aiToolsEnabled.automation ? "default" : "secondary"}>
                    {aiToolsEnabled.automation ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lead-scoring" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Lead Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Revenue Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Predictive Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>Automation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lead-scoring">
            {aiToolsEnabled.leadScoring ? (
              <LeadScoring />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lead Scoring is Disabled</h3>
                  <p className="text-muted-foreground mb-4">
                    Enable Lead Scoring in the control panel above to access this tool.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="forecasting">
            {aiToolsEnabled.forecasting ? (
              <RevenueForecast />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Revenue Forecasting is Disabled</h3>
                  <p className="text-muted-foreground mb-4">
                    Enable Revenue Forecasting in the control panel above to access this tool.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {aiToolsEnabled.analytics ? (
              <PredictiveAnalytics />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Predictive Analytics is Disabled</h3>
                  <p className="text-muted-foreground mb-4">
                    Enable Predictive Analytics in the control panel above to access this tool.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="automation">
            {aiToolsEnabled.automation ? (
              <WorkflowAutomation />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Workflow Automation is Disabled</h3>
                  <p className="text-muted-foreground mb-4">
                    Enable Workflow Automation in the control panel above to access this tool.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}