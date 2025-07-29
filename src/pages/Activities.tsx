import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Phone, Mail, Calendar, FileText, DollarSign, Clock, User, Bell, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
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
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
          <Button onClick={fetchNotifications} variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
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
              <div className="text-2xl font-bold">{activityStats.notifications}</div>
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
                <Clock className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading activities...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications or activities yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          activity.status === 'Pending' ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${
                            activity.status === 'Pending' ? 'text-destructive' : 'text-primary'
                          }`} />
                        </div>
                        {index < activities.length - 1 && (
                          <div className="h-6 w-px bg-border mt-2" />
                        )}
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium text-foreground">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant={getStatusColor(activity.status)} className="text-xs">
                              {activity.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {activity.officer === 'System' ? 'SYS' : activity.officer.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">Source:</span>
                            <span className="font-medium">{activity.officer}</span>
                          </div>
                          {activity.notification_type && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="font-medium text-accent capitalize">
                                {activity.notification_type.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {index < activities.length - 1 && (
                          <div className="border-b pt-3" />
                        )}
                      </div>
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