import { useState } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText, 
  Zap, 
  BarChart3,
  Users,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Bot,
  Target,
  Clock,
  TrendingUp
} from "lucide-react"

const integrations = [
  {
    id: "email",
    name: "Email Marketing",
    description: "Connect with Mailchimp, HubSpot, or custom SMTP",
    icon: Mail,
    category: "communication",
    status: "available",
    features: ["Drip campaigns", "Email templates", "Open tracking", "Click tracking"]
  },
  {
    id: "sms",
    name: "SMS Integration",
    description: "Two-way SMS messaging with clients",
    icon: MessageSquare,
    category: "communication", 
    status: "available",
    features: ["Bulk SMS", "Two-way messaging", "SMS templates", "Delivery reports"]
  },
  {
    id: "calendar",
    name: "Calendar Sync",
    description: "Sync with Google Calendar, Outlook, and more",
    icon: Calendar,
    category: "productivity",
    status: "connected",
    features: ["Two-way sync", "Meeting scheduling", "Availability", "Reminders"]
  },
  {
    id: "accounting",
    name: "Accounting Software",
    description: "Connect with QuickBooks, Xero, FreshBooks",
    icon: CreditCard,
    category: "finance",
    status: "available",
    features: ["Invoice sync", "Payment tracking", "Expense management", "Reports"]
  },
  {
    id: "esignature",
    name: "E-Signature",
    description: "DocuSign, HelloSign integration",
    icon: FileText,
    category: "documents",
    status: "available",
    features: ["Document signing", "Templates", "Audit trail", "Reminders"]
  },
  {
    id: "zapier",
    name: "Zapier Automation",
    description: "Connect with 5000+ apps via Zapier",
    icon: Zap,
    category: "automation",
    status: "connected",
    features: ["Automated workflows", "Data sync", "Triggers", "Multi-step zaps"]
  }
]

const aiTools = [
  {
    id: "lead-scoring",
    name: "AI Lead Scoring",
    description: "Automatically score and prioritize leads",
    icon: Target,
    status: "active",
    features: ["Behavioral scoring", "Demographic analysis", "Engagement tracking", "Priority ranking"]
  },
  {
    id: "forecasting",
    name: "Revenue Forecasting",
    description: "Predict revenue based on pipeline data",
    icon: TrendingUp,
    status: "active", 
    features: ["Pipeline analysis", "Seasonal trends", "Confidence intervals", "Goal tracking"]
  },
  {
    id: "automation",
    name: "Workflow Automation",
    description: "Automate repetitive tasks and follow-ups",
    icon: Bot,
    status: "active",
    features: ["Task automation", "Email sequences", "Stage transitions", "Reminders"]
  },
  {
    id: "analytics",
    name: "Predictive Analytics",
    description: "AI-powered insights and recommendations",
    icon: BarChart3,
    status: "available",
    features: ["Performance insights", "Trend analysis", "Recommendations", "Custom reports"]
  }
]

export default function Integrations() {
  const [activeTab, setActiveTab] = useState("integrations")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [emailSettings, setEmailSettings] = useState({
    provider: "",
    apiKey: "",
    enabled: false
  })
  const { toast } = useToast()

  const handleBrowseMarketplace = () => {
    // Open the integrations marketplace in a new tab
    window.open('https://zapier.com/apps', '_blank')
    toast({
      title: "Opening Integration Marketplace",
      description: "Browse thousands of available integrations",
    })
  }

  const handleWebhookSave = () => {
    if (webhookUrl) {
      toast({
        title: "Webhook URL Saved",
        description: "Zapier integration configured successfully",
      })
    }
  }

  const handleIntegrationToggle = (integrationId: string, enabled: boolean) => {
    toast({
      title: enabled ? "Integration Enabled" : "Integration Disabled",
      description: `${integrations.find(i => i.id === integrationId)?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return "bg-green-100 text-green-800"
      case "available":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "available":
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const categoryFilters = [
    { id: "all", name: "All Categories" },
    { id: "communication", name: "Communication" },
    { id: "productivity", name: "Productivity" },
    { id: "finance", name: "Finance" },
    { id: "documents", name: "Documents" },
    { id: "automation", name: "Automation" }
  ]

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations & Tools</h1>
            <p className="text-muted-foreground">
              Connect your CRM with external services and enable AI-powered tools
            </p>
          </div>
          <Button onClick={handleBrowseMarketplace}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="integrations">Third-Party Integrations</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks & API</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <integration.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(integration.status)}
                            <Badge className={getStatusColor(integration.status)}>
                              {integration.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch 
                        checked={integration.status === "connected"}
                        onCheckedChange={(enabled) => handleIntegrationToggle(integration.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{integration.description}</CardDescription>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Features:</Label>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={integration.status === "connected" ? "outline" : "default"}
                    >
                      {integration.status === "connected" ? "Configure" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {aiTools.map((tool) => (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <tool.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(tool.status)}
                            <Badge className={getStatusColor(tool.status)}>
                              {tool.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch 
                        checked={tool.status === "active"}
                        onCheckedChange={(enabled) => handleIntegrationToggle(tool.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{tool.description}</CardDescription>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Capabilities:</Label>
                      <div className="flex flex-wrap gap-1">
                        {tool.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={tool.status === "active" ? "outline" : "default"}
                    >
                      {tool.status === "active" ? "Configure" : "Enable"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Zapier Webhook</span>
                  </CardTitle>
                  <CardDescription>
                    Connect your CRM to Zapier for advanced automation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleWebhookSave} className="w-full">
                    Save Webhook URL
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>API Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure external API connections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Endpoints</Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>GET /api/leads</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>POST /api/clients</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>GET /api/pipeline</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    View API Documentation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}