import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { SecureVoiceAIIntegration } from "./SecureVoiceAIIntegration"

export function VoiceAIIntegration() {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This component has been upgraded with enhanced security. API keys are now encrypted and stored securely.
        </AlertDescription>
      </Alert>
      <SecureVoiceAIIntegration />
    </div>
  )
}