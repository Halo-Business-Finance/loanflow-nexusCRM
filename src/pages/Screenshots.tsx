import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dashboardImg from "@/assets/crm-dashboard-screenshot.png";
import pipelineImg from "@/assets/pipeline-screenshot.png";
import leadsImg from "@/assets/leads-screenshot.png";
import enterpriseImg from "@/assets/enterprise-screenshot.png";

const Screenshots = () => {
  const screenshots = [
    {
      title: "CRM Dashboard Overview",
      description: "Main dashboard with key metrics, pipeline value, and performance charts",
      image: dashboardImg
    },
    {
      title: "Interactive Pipeline View",
      description: "Visual sales funnel showing leads moving through loan stages",
      image: pipelineImg
    },
    {
      title: "Lead Management Interface",
      description: "Contact card interface with client details and action buttons",
      image: leadsImg
    },
    {
      title: "Enterprise Tools",
      description: "Advanced loan management and workflow automation tools",
      image: enterpriseImg
    }
  ];

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CRM Screenshots</h1>
        <p className="text-muted-foreground">Professional screenshots of your loan origination CRM system</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {screenshots.map((screenshot, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{screenshot.title}</CardTitle>
              <CardDescription>{screenshot.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <img 
                src={screenshot.image} 
                alt={screenshot.title}
                className="w-full h-auto border-b"
              />
              <div className="p-4">
                <Button 
                  onClick={() => downloadImage(screenshot.image, `${screenshot.title.toLowerCase().replace(/\s+/g, '-')}.png`)}
                  className="w-full"
                >
                  Download Screenshot
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Usage Instructions</h2>
        <p className="text-sm text-muted-foreground">
          These screenshots show your loan origination CRM system's key features that originators use daily:
          dashboard metrics, interactive pipeline management, lead cards with contact details, and enterprise workflow tools.
          Click the download buttons above to save these images for presentations or documentation.
        </p>
      </div>
    </div>
  );
};

export default Screenshots;