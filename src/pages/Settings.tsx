import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataIntegrityDashboard } from "@/components/DataIntegrityDashboard"
import { 
  Settings as SettingsIcon,
  Database, 
  Shield, 
  User, 
  Bell
} from "lucide-react"

export default function Settings() {
  const [dataIntegrityResults, setDataIntegrityResults] = useState<any>(null)

  const handleValidationComplete = (results: any) => {
    setDataIntegrityResults(results)
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          {dataIntegrityResults && (
            <Badge variant={dataIntegrityResults.summary.criticalIssues > 0 ? "destructive" : "secondary"}>
              Data Integrity: {dataIntegrityResults.summary.totalIssues === 0 ? 'Perfect' : `${dataIntegrityResults.summary.totalIssues} issues`}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="data-integrity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="data-integrity" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Data Integrity</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data-integrity">
            <DataIntegrityDashboard />
          </TabsContent>


          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Profile management coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}