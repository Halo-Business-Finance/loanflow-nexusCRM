import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Phone, 
  Settings, 
  Play,
  Square,
  Volume2,
  FileAudio,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function VoiceAIIntegration() {
  const [apiKey, setApiKey] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [agentId, setAgentId] = useState("")
  const [zapierWebhook, setZapierWebhook] = useState("")
  const { toast } = useToast()

  const handleStartCall = () => {
    if (!agentId) {
      toast({
        title: "Missing Configuration",
        description: "Please set up your ElevenLabs Agent ID first",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "AI Call Started",
      description: "Voice AI agent is now handling the call",
    })
  }

  const handleToggleRecording = () => {
    setIsRecording(!isRecording)
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Call notes will be generated" : "Call is being transcribed",
    })
  }

  const handleZapierTrigger = async () => {
    if (!zapierWebhook) {
      toast({
        title: "Missing Webhook",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      })
      return
    }

    try {
      await fetch(zapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          event: "call_completed",
          timestamp: new Date().toISOString(),
          source: "voice_ai"
        }),
      })

      toast({
        title: "Automation Triggered",
        description: "Zapier workflow has been activated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger automation",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apikey">ElevenLabs API Key</Label>
            <Input
              id="apikey"
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from ElevenLabs dashboard
            </p>
          </div>

          <div>
            <Label htmlFor="agentid">Agent ID</Label>
            <Input
              id="agentid"
              placeholder="Enter your conversational AI agent ID"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="webhook">Zapier Webhook URL</Label>
            <Input
              id="webhook"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={zapierWebhook}
              onChange={(e) => setZapierWebhook(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Connect to Zapier for automated follow-ups
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">AI Capabilities:</h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div>• Automated lead qualification calls</div>
              <div>• Real-time call transcription</div>
              <div>• Appointment scheduling</div>
              <div>• Follow-up call automation</div>
              <div>• Sentiment analysis</div>
              <div>• CRM auto-population</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Controls */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice AI Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Call Controls */}
          <div className="space-y-3">
            <h4 className="font-medium">AI Call Assistant</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleStartCall} className="gap-2">
                <Phone className="h-4 w-4" />
                Start AI Call
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  // Voice settings functionality
                  const { toast } = require("@/hooks/use-toast")
                  toast({
                    title: "Voice Settings",
                    description: "Voice configuration panel will be available soon.",
                  })
                }}
              >
                <Volume2 className="h-4 w-4" />
                Voice Settings
              </Button>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="space-y-3">
            <h4 className="font-medium">Call Recording</h4>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleToggleRecording}
                variant={isRecording ? "destructive" : "default"}
                className="gap-2"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  Recording...
                </Badge>
              )}
            </div>
          </div>

          {/* Automation Trigger */}
          <div className="space-y-3">
            <h4 className="font-medium">Workflow Automation</h4>
            <Button 
              onClick={handleZapierTrigger}
              variant="outline" 
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" />
              Trigger Follow-up Workflow
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h4 className="font-medium">Recent AI Calls</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  <span>John Smith - Follow-up</span>
                </div>
                <Badge variant="secondary">2 min ago</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  <span>Sarah Johnson - Qualification</span>
                </div>
                <Badge variant="secondary">1 hour ago</Badge>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Pro Tip:</strong> Set up Zapier workflows to automatically send documents, 
              schedule follow-ups, and update CRM records after each AI call.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}