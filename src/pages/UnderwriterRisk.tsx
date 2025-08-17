import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, AlertTriangle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnderwriterRisk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Assessment</h1>
        <p className="text-muted-foreground">
          Comprehensive risk analysis and assessment tools for loan underwriting
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Applications flagged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">
              Requires closer review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              Safe to proceed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score Avg</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">74.5</div>
            <p className="text-xs text-muted-foreground">
              Portfolio average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Factors Analysis</CardTitle>
            <CardDescription>Key risk indicators for current portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Credit Score Range</span>
                <span className="text-sm font-medium">650-850</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Debt-to-Income Ratio</span>
                <span className="text-sm font-medium">&lt; 43%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Employment History</span>
                <span className="text-sm font-medium">2+ years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Down Payment</span>
                <span className="text-sm font-medium">≥ 20%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Risk Assessments</CardTitle>
            <CardDescription>Latest applications evaluated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Application #12345</p>
                  <p className="text-sm text-muted-foreground">John Doe - $450,000</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">Low Risk (85)</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Application #12346</p>
                  <p className="text-sm text-muted-foreground">Jane Smith - $320,000</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-yellow-600">Medium Risk (65)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}