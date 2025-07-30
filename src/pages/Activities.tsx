import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, Phone, Mail, Calendar, FileText, DollarSign, Clock, User, Bell, AlertCircle, Plus, CheckCircle2, X, Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  related_id?: string
  related_type?: string
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  customer?: string
  officer: string
  timestamp: string
  status: string
  outcome?: string
  notification_type?: string
}

export default function Activities() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [newActivityOpen, setNewActivityOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const notificationData = (data as Notification[]) || []
      setNotifications(notificationData)

      // Convert notifications to activities format
      const notificationActivities: Activity[] = notificationData.map(notification => ({
        id: notification.id,
        type: getActivityTypeFromNotification(notification.type),
        title: notification.title,
        description: notification.message,
        officer: "System", // Since notifications are system-generated
        timestamp: formatTimestamp(notification.created_at),
        status: notification.is_read ? "Completed" : "Pending",
        notification_type: notification.type
      }))

      setActivities(notificationActivities)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription for new notifications
    if (user) {
      const channel = supabase
        .channel('notifications_activities')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  // Filter activities based on search and filters
  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.officer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(activity => 
        activity.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(activity => 
        activity.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, filterType, filterStatus])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification marked as read",
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error", 
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read", 
        variant: "destructive",
      });
    }
  };

  const createActivity = async (activityData: Partial<Activity>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          title: activityData.title,
          message: activityData.description,
          type: 'manual_activity',
          is_read: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity created successfully",
      });

      setNewActivityOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity",
        variant: "destructive",
      });
    }
  };

  const getActivityTypeFromNotification = (notificationType: string) => {
    switch (notificationType) {
      case 'follow_up_reminder':
      case 'lead_status_change':
        return 'Call'
      case 'client_created':
      case 'lead_created':
        return 'Contact'
      case 'loan_created':
        return 'Document'
      default:
        return 'Notification'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return Phone
      case 'email': return Mail
      case 'meeting': return Calendar
      case 'document': return FileText
      case 'contact': return User
      case 'notification': return Bell
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'pending': return 'destructive'
      default: return 'secondary'
    }
  }

  const activityStats = {
    today: activities.filter(a => a.timestamp.includes('hour') || a.timestamp.includes('Just now')).length,
    thisWeek: activities.filter(a => a.timestamp.includes('day') || a.timestamp.includes('hour') || a.timestamp.includes('Just now')).length,
    notifications: activities.length,
    unread: activities.filter(a => a.status === 'Pending').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activities & Notifications</h1>
            <p className="text-muted-foreground">Track all notifications, reminders, and system activities</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={fetchNotifications} variant="outline" className="gap-2">
              <Clock className="h-4 w-4 text-white" />
              Refresh
            </Button>
            <Dialog open={newActivityOpen} onOpenChange={setNewActivityOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4 text-white" />
                  New Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Activity</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  createActivity({
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    type: formData.get('type') as string,
                  });
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input name="title" placeholder="Activity title" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea name="description" placeholder="Activity description" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue="notification">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Create Activity</Button>
                    <Button type="button" variant="outline" onClick={() => setNewActivityOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {activityStats.unread > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-white" />
                <Input
                  placeholder="Search activities..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.today}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.thisWeek}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredActivities.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{activityStats.unread}</div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Timeline */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Notifications & Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-6 w-6 animate-spin text-white" />
                <span className="ml-2">Loading activities...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-white mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== "all" || filterStatus !== "all" 
                    ? "No activities match your filters" 
                    : "No notifications or activities yet"
                  }
                </p>
                {(searchTerm || filterType !== "all" || filterStatus !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setFilterStatus("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="group">
                      <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary/20 hover:border-l-primary/50">
                        <div className="flex gap-4">
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              activity.status === 'Pending' ? 'bg-destructive/10' : 'bg-primary/10'
                            }`}>
                              <IconComponent className={`h-4 w-4 ${
                                activity.status === 'Pending' ? 'text-destructive' : 'text-primary'
                              }`} />
                            </div>
                          </div>
                          
                          {/* Activity Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-foreground">{activity.title}</h3>
                                  <Badge variant={getStatusColor(activity.status)} className="text-xs">
                                    {activity.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {activity.officer}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.timestamp}
                                  </span>
                                  {activity.type && (
                                    <Badge variant="outline" className="text-xs">
                                      {activity.type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {activity.status === 'Pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(activity.id);
                                    }}
                                    className="h-8 px-3"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Mark Read
                                  </Button>
                                )}
                                {activity.notification_type && ['lead_created', 'lead_status_change', 'follow_up_reminder'].includes(activity.notification_type) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                       const notification = notifications.find(n => n.id === activity.id);
                                       if (notification?.related_type === 'lead' && notification?.related_id) {
                                         navigate(`/leads/${notification.related_id}`);
                                       } else {
                                         navigate('/leads');
                                       }
                                    }}
                                    className="h-8 px-3"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    View Lead
                                  </Button>
                                )}
                                {activity.notification_type === 'client_created' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                       navigate('/clients');
                                    }}
                                    className="h-8 px-3"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    View Client
                                  </Button>
                                )}
                                {activity.notification_type === 'loan_created' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/clients');
                                    }}
                                    className="h-8 px-3"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    View Loan
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}