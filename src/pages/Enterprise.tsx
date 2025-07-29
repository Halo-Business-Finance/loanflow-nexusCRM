import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomObjectsManager } from "@/components/enterprise/CustomObjectsManager";
import { WorkflowBuilder } from "@/components/enterprise/WorkflowBuilder";
import { ApprovalProcessManager } from "@/components/enterprise/ApprovalProcessManager";
import { TerritoryManager } from "@/components/enterprise/TerritoryManager";
import { ForecastingDashboard } from "@/components/enterprise/ForecastingDashboard";
import { OpportunityManager } from "@/components/enterprise/OpportunityManager";
import { 
  Database, 
  Workflow, 
  CheckCircle, 
  Map, 
  TrendingUp, 
  Target,
  Shield
} from "lucide-react";

export default function Enterprise() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("custom-objects");

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="text-center">
          <CardHeader>
            <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Only administrators can access enterprise features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const features = [
    {
      id: "custom-objects",
      label: "Custom Objects",
      icon: Database,
      description: "Create custom data models beyond leads and clients"
    },
    {
      id: "workflows",
      label: "Workflow Builder",
      icon: Workflow,
      description: "Visual process automation with conditional logic"
    },
    {
      id: "approvals",
      label: "Approval Processes",
      icon: CheckCircle,
      description: "Multi-step approval workflows for deals and pricing"
    },
    {
      id: "territories",
      label: "Territory Management",
      icon: Map,
      description: "Geographic and hierarchical territory assignment"
    },
    {
      id: "forecasting",
      label: "Sales Forecasting",
      icon: TrendingUp,
      description: "Advanced forecasting with multiple methodologies"
    },
    {
      id: "opportunities",
      label: "Opportunity Splits",
      icon: Target,
      description: "Revenue sharing across multiple team members"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Features</h1>
        <p className="text-muted-foreground">
          Advanced CRM capabilities for enterprise-level sales management.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <TabsTrigger key={feature.id} value={feature.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{feature.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeTab === feature.id;
            return (
              <Card 
                key={feature.id} 
                className={`cursor-pointer transition-colors ${
                  isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setActiveTab(feature.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    {isActive && <Badge variant="secondary">Active</Badge>}
                  </div>
                  <CardTitle className="text-sm">{feature.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <TabsContent value="custom-objects" className="space-y-6">
          <CustomObjectsManager />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <ApprovalProcessManager />
        </TabsContent>

        <TabsContent value="territories" className="space-y-6">
          <TerritoryManager />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <ForecastingDashboard />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <OpportunityManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}