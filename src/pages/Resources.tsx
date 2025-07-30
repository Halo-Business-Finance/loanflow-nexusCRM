import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Download, BookOpen, Video, Globe } from "lucide-react";

const resourceCategories = [
  {
    title: "Documentation",
    icon: FileText,
    items: [
      { name: "User Manual", type: "PDF", url: "https://docs.lovable.dev/" },
      { name: "API Documentation", type: "Web", url: "https://supabase.com/docs" },
      { name: "Best Practices Guide", type: "PDF", url: "https://docs.lovable.dev/tips-tricks/troubleshooting" },
    ]
  },
  {
    title: "Training Materials",
    icon: BookOpen,
    items: [
      { name: "Getting Started Tutorial", type: "Video", url: "https://www.youtube.com/watch?v=9KHLTZaJcR8" },
      { name: "Advanced Features Training", type: "Video", url: "https://www.youtube.com/playlist?list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO" },
      { name: "CRM Workflow Guide", type: "PDF", url: "https://docs.lovable.dev/user-guides/quickstart" },
    ]
  },
  {
    title: "External Resources",
    icon: Globe,
    items: [
      { name: "Industry Reports", type: "Web", url: "https://www.sba.gov/partners/lenders" },
      { name: "Compliance Guidelines", type: "PDF", url: "https://www.fdic.gov/regulations/compliance/" },
      { name: "Regulatory Updates", type: "Web", url: "https://www.consumerfinance.gov/" },
    ]
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'PDF':
      return Download;
    case 'Video':
      return Video;
    case 'Web':
      return ExternalLink;
    default:
      return FileText;
  }
};

export default function Resources() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Access documentation, training materials, and helpful resources
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resourceCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="w-5 h-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.type}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => window.open('https://docs.lovable.dev/', '_blank', 'noopener,noreferrer')}
              >
                <BookOpen className="w-4 h-4" />
                Knowledge Base
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => window.open('https://www.youtube.com/playlist?list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO', '_blank', 'noopener,noreferrer')}
              >
                <Video className="w-4 h-4" />
                Video Tutorials
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => window.open('https://docs.lovable.dev/user-guides/quickstart', '_blank', 'noopener,noreferrer')}
              >
                <FileText className="w-4 h-4" />
                Template Library
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => window.open('https://discord.com/channels/1119885301872070706/1280461670979993613', '_blank', 'noopener,noreferrer')}
              >
                <Globe className="w-4 h-4" />
                Community Forum
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}