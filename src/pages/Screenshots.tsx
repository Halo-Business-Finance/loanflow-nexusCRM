import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Screenshots = () => {
  const screenshots = [
    {
      title: "CRM Dashboard Overview",
      description: "Main dashboard with key metrics, pipeline value, and performance charts",
      path: "/crm-dashboard.png"
    },
    {
      title: "Pipeline View",
      description: "Visual sales funnel showing leads moving through stages",
      path: "/pipeline-view.png"
    },
    {
      title: "Lead Management Cards",
      description: "Contact card interface with client details and action buttons",
      path: "/lead-cards.png"
    },
    {
      title: "Loan Program Matrix",
      description: "Product comparison table with rates and requirements",
      path: "/loan-matrix.png"
    }
  ];

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
                src={screenshot.path} 
                alt={screenshot.title}
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden p-4 text-center text-muted-foreground bg-muted">
                Image not found at {screenshot.path}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Download Links</h2>
        <div className="space-y-2">
          {screenshots.map((screenshot, index) => (
            <div key={index}>
              <a 
                href={screenshot.path} 
                download 
                className="text-primary hover:underline"
              >
                Download {screenshot.title}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Screenshots;