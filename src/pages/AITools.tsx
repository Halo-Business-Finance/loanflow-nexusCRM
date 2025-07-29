import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadScoring } from "@/components/ai/LeadScoring"
import { RevenueForecast } from "@/components/analytics/RevenueForecast"
import { PredictiveAnalytics } from "@/components/ai/PredictiveAnalytics"
import { WorkflowAutomation } from "@/components/ai/WorkflowAutomation"
import { Target, TrendingUp, BarChart3, Bot } from "lucide-react"

export default function AITools() {
  const [activeTab, setActiveTab] = useState("lead-scoring")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Tools</h1>
          <p className="text-muted-foreground">
            AI-powered tools to enhance your CRM workflows and decision-making
          </p>
        </div>
      </div>

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
          <LeadScoring />
        </TabsContent>

        <TabsContent value="forecasting">
          <RevenueForecast />
        </TabsContent>

        <TabsContent value="analytics">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="automation">
          <WorkflowAutomation />
        </TabsContent>
      </Tabs>
    </div>
  )
}