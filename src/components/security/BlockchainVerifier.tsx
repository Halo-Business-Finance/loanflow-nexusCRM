import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Hash, 
  Link as LinkIcon,
  RefreshCw,
  FileCheck,
  AlertTriangle
} from "lucide-react"
import { BlockchainIntegrity, type IntegrityResult } from "@/lib/blockchain-integrity"
import { useToast } from "@/hooks/use-toast"

interface BlockchainVerifierProps {
  recordType?: string
  recordId?: string
  showAuditTrail?: boolean
}

export function BlockchainVerifier({ 
  recordType, 
  recordId, 
  showAuditTrail = true 
}: BlockchainVerifierProps) {
  const { toast } = useToast()
  const [verificationResult, setVerificationResult] = useState<IntegrityResult | null>(null)
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [networkStatus, setNetworkStatus] = useState<any>(null)
  const [bulkVerification, setBulkVerification] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    loadNetworkStatus()
    if (showAuditTrail) {
      loadAuditTrail()
    }
  }, [recordType, recordId, showAuditTrail])

  const loadNetworkStatus = async () => {
    try {
      const status = await BlockchainIntegrity.getNetworkStatus()
      setNetworkStatus(status)
    } catch (error) {
      console.error('Failed to load network status:', error)
    }
  }

  const loadAuditTrail = async () => {
    try {
      setIsLoading(true)
      const trail = await BlockchainIntegrity.getAuditTrail(recordType, recordId)
      setAuditTrail(trail)
    } catch (error) {
      console.error('Failed to load audit trail:', error)
      toast({
        title: "Error",
        description: "Failed to load audit trail",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyIntegrity = async (data: any) => {
    if (!recordType || !recordId) {
      toast({
        title: "Error",
        description: "Record type and ID are required for verification",
        variant: "destructive",
      })
      return
    }

    try {
      setIsVerifying(true)
      const result = await BlockchainIntegrity.verifyIntegrity(recordType, recordId, data)
      setVerificationResult(result)

      if (result.isValid) {
        toast({
          title: "Verification Successful",
          description: "Data integrity verified against blockchain records",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: "Data integrity verification failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Verification failed:', error)
      toast({
        title: "Error",
        description: "Failed to verify data integrity",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const performBulkVerification = async () => {
    if (!recordType) {
      toast({
        title: "Error",
        description: "Record type is required for bulk verification",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await BlockchainIntegrity.performBulkIntegrityCheck(recordType)
      setBulkVerification(result)

      toast({
        title: "Bulk Verification Complete",
        description: `Verified ${result.totalChecked} records. ${result.validRecords} valid, ${result.invalidRecords} invalid.`,
      })
    } catch (error) {
      console.error('Bulk verification failed:', error)
      toast({
        title: "Error",
        description: "Failed to perform bulk verification",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "default",
      failed: "destructive",
      pending: "secondary"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Network Status */}
      {networkStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Blockchain Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{networkStatus.status}</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{networkStatus.blockHeight.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Block Height</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{networkStatus.networkHealth}</div>
                <div className="text-sm text-muted-foreground">Health</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">
                  {new Date(networkStatus.lastSync).toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Sync</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="verification" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Check</TabsTrigger>
        </TabsList>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Data Integrity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => verifyIntegrity({})}
                  disabled={isVerifying || !recordType || !recordId}
                  className="flex items-center gap-2"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Verify Integrity
                </Button>
                <Button
                  variant="outline"
                  onClick={loadAuditTrail}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {verificationResult && (
                <Alert className={verificationResult.isValid ? "border-green-500" : "border-red-500"}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verificationResult.verificationStatus)}
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>Status:</strong> {verificationResult.verificationStatus}
                        </div>
                        {verificationResult.blockchainHash && (
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono text-sm">
                              {verificationResult.blockchainHash}
                            </span>
                          </div>
                        )}
                        {verificationResult.lastVerified && (
                          <div>
                            <strong>Last Verified:</strong> {new Date(verificationResult.lastVerified).toLocaleString()}
                          </div>
                        )}
                        {verificationResult.discrepancies && verificationResult.discrepancies.length > 0 && (
                          <div>
                            <strong>Issues:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {verificationResult.discrepancies.map((issue, index) => (
                                <li key={index} className="text-sm">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Immutable Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading audit trail...</span>
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit trail records found
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {auditTrail.map((entry, index) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(entry.is_verified ? 'verified' : 'pending')}
                            <span className="font-medium">{entry.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(entry.is_verified ? 'verified' : 'pending')}
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {entry.blockchain_records && (
                          <div className="space-y-2 text-sm">
                            <Separator />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <strong>Transaction:</strong>
                                <div className="font-mono text-xs break-all">
                                  {entry.blockchain_records.transaction_hash || 'Pending'}
                                </div>
                              </div>
                              <div>
                                <strong>Block:</strong>
                                <div className="font-mono text-xs">
                                  #{entry.blockchain_records.block_number || 'Pending'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Verification Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Bulk Integrity Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={performBulkVerification}
                disabled={isLoading || !recordType}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Run Bulk Verification
              </Button>

              {bulkVerification && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{bulkVerification.totalChecked}</div>
                        <div className="text-sm text-muted-foreground">Total Checked</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{bulkVerification.validRecords}</div>
                        <div className="text-sm text-muted-foreground">Valid</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">{bulkVerification.invalidRecords}</div>
                        <div className="text-sm text-muted-foreground">Invalid</div>
                      </CardContent>
                    </Card>
                  </div>

                  {bulkVerification.details.length > 0 && (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {bulkVerification.details.map((detail: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-mono text-sm">{detail.recordId}</span>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(detail.isValid ? 'verified' : 'failed')}
                              {getStatusBadge(detail.isValid ? 'verified' : 'failed')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}