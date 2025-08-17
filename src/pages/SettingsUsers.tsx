import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, Settings, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SettingsUsers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Settings className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Manage all user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b pb-2">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Last Login</span>
              <span>Actions</span>
            </div>
            
            <div className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
              <span className="font-medium">John Doe</span>
              <span className="text-muted-foreground">john.doe@example.com</span>
              <span>Administrator</span>
              <span className="text-green-600">Active</span>
              <span className="text-muted-foreground">2 hours ago</span>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            
            <div className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
              <span className="font-medium">Jane Smith</span>
              <span className="text-muted-foreground">jane.smith@example.com</span>
              <span>Lead Manager</span>
              <span className="text-green-600">Active</span>
              <span className="text-muted-foreground">1 day ago</span>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            
            <div className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
              <span className="font-medium">Mike Wilson</span>
              <span className="text-muted-foreground">mike.wilson@example.com</span>
              <span>Underwriter</span>
              <span className="text-green-600">Active</span>
              <span className="text-muted-foreground">3 hours ago</span>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            
            <div className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
              <span className="font-medium">Sarah Johnson</span>
              <span className="text-muted-foreground">sarah.johnson@example.com</span>
              <span>Processor</span>
              <span className="text-yellow-600">Pending</span>
              <span className="text-muted-foreground">Never</span>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            
            <div className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
              <span className="font-medium">Robert Brown</span>
              <span className="text-muted-foreground">robert.brown@example.com</span>
              <span>Closer</span>
              <span className="text-gray-600">Inactive</span>
              <span className="text-muted-foreground">2 weeks ago</span>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Manage role definitions and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">Full system access</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Lead Manager</p>
                  <p className="text-sm text-muted-foreground">Lead management and assignment</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Underwriter</p>
                  <p className="text-sm text-muted-foreground">Loan review and approval</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user management activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Plus className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">New user added</p>
                  <p className="text-sm text-muted-foreground">sarah.johnson@example.com - 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Role updated</p>
                  <p className="text-sm text-muted-foreground">mike.wilson@example.com - 1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Permission granted</p>
                  <p className="text-sm text-muted-foreground">jane.smith@example.com - 3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}