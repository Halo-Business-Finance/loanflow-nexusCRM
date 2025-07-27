import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, Filter, FileText, Calendar, User, DollarSign, Clock, Download, Upload, Eye } from "lucide-react"

const documents = [
  {
    id: "DOC-001",
    customerName: "Sarah Johnson",
    fileName: "Income_Verification.pdf",
    documentType: "Income Statement",
    status: "Verified",
    uploadDate: "2024-01-15",
    fileSize: "2.3 MB",
    officer: "Mike Smith",
    loanAmount: "$450,000"
  },
  {
    id: "DOC-002",
    customerName: "Michael Chen",
    fileName: "Credit_Report.pdf",
    documentType: "Credit Report",
    status: "Pending Review",
    uploadDate: "2024-01-12",
    fileSize: "1.8 MB",
    officer: "Sarah Davis",
    loanAmount: "$320,000"
  },
  {
    id: "DOC-003",
    customerName: "Emily Rodriguez",
    fileName: "Bank_Statements.pdf",
    documentType: "Bank Statement",
    status: "Missing",
    uploadDate: "-",
    fileSize: "-",
    officer: "John Wilson",
    loanAmount: "$275,000"
  },
  {
    id: "DOC-004",
    customerName: "David Thompson",
    fileName: "Property_Appraisal.pdf",
    documentType: "Appraisal",
    status: "Verified",
    uploadDate: "2024-01-10",
    fileSize: "4.1 MB",
    officer: "Lisa Chen",
    loanAmount: "$680,000"
  },
  {
    id: "DOC-005",
    customerName: "Anna Lee",
    fileName: "Employment_Letter.pdf",
    documentType: "Employment Verification",
    status: "Approved",
    uploadDate: "2024-01-08",
    fileSize: "856 KB",
    officer: "Mike Smith",
    loanAmount: "$390,000"
  }
]

export default function Documents() {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default'
      case 'verified': return 'default'
      case 'pending review': return 'secondary'
      case 'missing': return 'destructive'
      default: return 'secondary'
    }
  }

  const statusCounts = {
    total: documents.length,
    verified: documents.filter(doc => doc.status === 'Verified' || doc.status === 'Approved').length,
    pending: documents.filter(doc => doc.status === 'Pending Review').length,
    missing: documents.filter(doc => doc.status === 'Missing').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
            <p className="text-muted-foreground">Manage and track loan documents</p>
          </div>
          <Button className="bg-gradient-primary">
            Upload Document
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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

        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.verified}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{statusCounts.pending}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Missing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statusCounts.missing}</div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="grid gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{document.id}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {document.documentType}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{document.customerName}</p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {document.uploadDate !== '-' ? `Uploaded: ${document.uploadDate}` : 'Not uploaded'}
                      </div>
                    </div>
                  </div>

                  {/* File Information */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{document.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {document.fileSize !== '-' ? document.fileSize : 'File size unknown'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <div>
                        <div className="text-sm text-muted-foreground">Loan Amount</div>
                        <div className="font-medium">{document.loanAmount}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Upload Date</div>
                        <div className="font-medium">{document.uploadDate}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Officer</div>
                        <div className="font-medium">{document.officer}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {document.status !== 'Missing' ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button size="sm" className="flex-1">
                          Verify
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1 gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}