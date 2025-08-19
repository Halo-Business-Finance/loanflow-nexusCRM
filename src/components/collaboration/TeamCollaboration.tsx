import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Users, 
  Calendar,
  FileText,
  Share2,
  Plus,
  Send,
  Video,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Filter,
  Search,
  Bell,
  Settings,
  UserPlus,
  MessageCircle,
  Eye,
  Edit
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
}

interface SharedDocument {
  id: string;
  title: string;
  type: 'lead' | 'client' | 'document' | 'report';
  sharedBy: string;
  sharedWith: string[];
  timestamp: string;
  permissions: 'view' | 'edit' | 'full';
}

interface TeamActivity {
  id: string;
  type: 'message' | 'document' | 'meeting' | 'task' | 'deal';
  description: string;
  user: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

export function TeamCollaboration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - would be replaced with real data
  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Sarah Johnson', role: 'Senior Loan Officer', email: 'sarah@company.com', status: 'online', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&size=32` },
    { id: '2', name: 'Mike Chen', role: 'Underwriter', email: 'mike@company.com', status: 'busy', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mike&size=32` },
    { id: '3', name: 'Emily Rodriguez', role: 'Loan Processor', email: 'emily@company.com', status: 'online', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=emily&size=32` },
    { id: '4', name: 'David Kim', role: 'Closer', email: 'david@company.com', status: 'away', lastSeen: '2024-01-15T10:30:00Z', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=david&size=32` },
    { id: '5', name: 'Lisa Wong', role: 'Business Development', email: 'lisa@company.com', status: 'offline', lastSeen: '2024-01-15T09:15:00Z', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=lisa&size=32` }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', content: 'New lead from ABC Corp - $500K SBA loan request', senderId: '1', senderName: 'Sarah Johnson', timestamp: '2024-01-15T11:30:00Z', type: 'text' },
    { id: '2', content: 'I can start the underwriting process today', senderId: '2', senderName: 'Mike Chen', timestamp: '2024-01-15T11:32:00Z', type: 'text' },
    { id: '3', content: 'Great! I\'ll prepare the initial documentation', senderId: '3', senderName: 'Emily Rodriguez', timestamp: '2024-01-15T11:35:00Z', type: 'text' },
    { id: '4', content: 'Credit report.pdf attached', senderId: '1', senderName: 'Sarah Johnson', timestamp: '2024-01-15T11:40:00Z', type: 'file', attachments: ['credit_report.pdf'] }
  ]);

  const [sharedDocuments] = useState<SharedDocument[]>([
    { id: '1', title: 'ABC Corp - SBA Application', type: 'document', sharedBy: 'Sarah Johnson', sharedWith: ['Mike Chen', 'Emily Rodriguez'], timestamp: '2024-01-15T11:40:00Z', permissions: 'edit' },
    { id: '2', title: 'Q1 Pipeline Report', type: 'report', sharedBy: 'David Kim', sharedWith: ['All Team'], timestamp: '2024-01-15T10:15:00Z', permissions: 'view' },
    { id: '3', title: 'XYZ Manufacturing Lead', type: 'lead', sharedBy: 'Lisa Wong', sharedWith: ['Sarah Johnson'], timestamp: '2024-01-15T09:30:00Z', permissions: 'full' }
  ]);

  const [teamActivity] = useState<TeamActivity[]>([
    { id: '1', type: 'deal', description: 'Deal closed: Tech Solutions Inc - $250K', user: 'Sarah Johnson', timestamp: '2024-01-15T11:45:00Z', priority: 'high' },
    { id: '2', type: 'document', description: 'Updated loan application for ABC Corp', user: 'Emily Rodriguez', timestamp: '2024-01-15T11:30:00Z', priority: 'medium' },
    { id: '3', type: 'meeting', description: 'Client meeting scheduled with XYZ Corp', user: 'Mike Chen', timestamp: '2024-01-15T11:15:00Z', priority: 'medium' },
    { id: '4', type: 'task', description: 'Completed underwriting review', user: 'David Kim', timestamp: '2024-01-15T10:45:00Z', priority: 'low' }
  ]);

  const channels = [
    { id: 'general', name: 'General', unread: 2 },
    { id: 'sales', name: 'Sales Team', unread: 0 },
    { id: 'underwriting', name: 'Underwriting', unread: 1 },
    { id: 'processing', name: 'Processing', unread: 0 },
    { id: 'announcements', name: 'Announcements', unread: 0 }
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      senderId: user?.id || '1',
      senderName: user?.email?.split('@')[0] || 'You',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, newMessage]);
    setMessage('');

    toast({
      title: "Message sent",
      description: "Your message has been sent to the team",
    });
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: TeamActivity['type']) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'document': return FileText;
      case 'meeting': return Calendar;
      case 'task': return CheckCircle;
      case 'deal': return Star;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: TeamActivity['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading collaboration workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Collaboration</h2>
          <p className="text-muted-foreground">Real-time communication and collaboration tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="documents">Shared Files</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="calendar">Shared Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Channels Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {channels.map(channel => (
                    <Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      <span># {channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {channel.unread}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle># {channels.find(c => c.id === selectedChannel)?.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 mb-4">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          {msg.attachments && (
                            <div className="mt-2">
                              {msg.attachments.map(file => (
                                <div key={file} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{file}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamMembers.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map(member => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                        {member.status === 'offline' && member.lastSeen && (
                          <p className="text-xs text-muted-foreground">
                            Last seen {formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Shared Documents
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Share Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sharedDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Shared by {doc.sharedBy} • {formatDistanceToNow(new Date(doc.timestamp), { addSuffix: true })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{doc.type}</Badge>
                          <Badge variant="outline">{doc.permissions}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Team Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamActivity.map(activity => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className={`flex items-start gap-3 p-3 border rounded-lg ${getPriorityColor(activity.priority)}`}>
                      <IconComponent className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium">{activity.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Shared Team Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Shared Calendar</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage team meetings, deadlines, and important events
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}