import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Screenshots = () => {
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const screenshotData = [
    {
      title: "Dashboard - Your CRM Overview",
      description: "Main dashboard showing your actual metrics, pipeline, and recent activity",
      filename: "localhost_5173.png"
    },
    {
      title: "Pipeline Management",
      description: "Your interactive sales pipeline with real stages and workflow",
      filename: "localhost_5173_pipeline.png"
    },
    {
      title: "Lead Management",
      description: "Your lead management interface with actual contact cards",
      filename: "localhost_5173_leads.png"
    },
    {
      title: "Enterprise Tools",
      description: "Your advanced business features and workflow management",
      filename: "localhost_5173_enterprise.png"
    }
  ];

  useEffect(() => {
    // Try to load the actual screenshots from the tmp directory
    const loadScreenshots = async () => {
      try {
        const imageUrls = [
          "tmp://fetched-websites/localhost_5173.png",
          "tmp://fetched-websites/localhost_5173_pipeline.png", 
          "tmp://fetched-websites/localhost_5173_leads.png",
          "tmp://fetched-websites/localhost_5173_enterprise.png"
        ];
        setScreenshots(imageUrls);
      } catch (error) {
        console.error("Failed to load screenshots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadScreenshots();
  }, []);

  const downloadScreenshot = (filename: string) => {
    // Create a link to download the screenshot
    const link = document.createElement('a');
    link.href = `tmp://fetched-websites/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your CRM Screenshots</h1>
        <p className="text-muted-foreground">
          Actual screenshots of your LoanFlow CRM system - captured live from your application
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {screenshotData.map((screenshot, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{screenshot.title}</CardTitle>
              <CardDescription>{screenshot.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <img 
                  src={screenshots[index]} 
                  alt={screenshot.title}
                  className="w-full h-auto border-b"
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden p-8 text-center bg-muted">
                  <p className="text-muted-foreground mb-4">
                    Screenshot not available - please visit the actual page to see it live
                  </p>
                  <Button 
                    onClick={() => window.open(screenshot.filename.includes('pipeline') ? '/pipeline' : 
                                               screenshot.filename.includes('leads') ? '/leads' :
                                               screenshot.filename.includes('enterprise') ? '/enterprise' : '/', '_blank')}
                    variant="outline"
                  >
                    View Live Page
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <Button 
                  onClick={() => downloadScreenshot(screenshot.filename)}
                  className="w-full"
                  variant="outline"
                >
                  Download Screenshot
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Live Page Access</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Since the captured screenshots may not display properly, you can access the live pages directly:
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              onClick={() => window.open('/', '_blank')}
              variant="outline" 
              className="w-full"
            >
              Dashboard
            </Button>
            <Button 
              onClick={() => window.open('/pipeline', '_blank')}
              variant="outline" 
              className="w-full"
            >
              Pipeline
            </Button>
            <Button 
              onClick={() => window.open('/leads', '_blank')}
              variant="outline" 
              className="w-full"
            >
              Leads
            </Button>
            <Button 
              onClick={() => window.open('/enterprise', '_blank')}
              variant="outline" 
              className="w-full"
            >
              Enterprise
            </Button>
          </div>
        </Card>
        
        <Card className="p-6 bg-muted">
          <h2 className="text-lg font-semibold mb-2">Alternative: Browser Screenshots</h2>
          <p className="text-sm text-muted-foreground">
            To capture your own screenshots: Open each page in your browser, then use your browser's screenshot tool 
            (usually F12 → Device toolbar → Screenshot icon) or your operating system's screenshot feature.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Screenshots;