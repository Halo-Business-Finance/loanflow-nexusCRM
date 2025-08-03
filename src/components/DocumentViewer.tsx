import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDocumentAnalytics } from '@/hooks/useDocumentAnalytics';
import { LeadDocument } from '@/hooks/useDocuments';

// Declare Adobe PDF Embed API types
declare global {
  interface Window {
    AdobeDC: any;
  }
}

interface DocumentViewerProps {
  document: LeadDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [adobeSDKLoaded, setAdobeSDKLoaded] = useState(false);
  const [useAdobeViewer, setUseAdobeViewer] = useState(true);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [adobeClientId, setAdobeClientId] = useState<string>('dc-pdf-embed-demo');
  const [isDemo, setIsDemo] = useState(true);
  const adobeViewerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Determine file types
  const isPdf = document?.file_mime_type?.includes('pdf') || document?.document_name?.toLowerCase().endsWith('.pdf');
  const isWordDoc = document?.file_mime_type?.includes('word') || 
                   document?.file_mime_type?.includes('document') ||
                   document?.document_name?.toLowerCase().match(/\.(doc|docx)$/);
  const isImage = document?.file_mime_type?.startsWith('image/');

  // Initialize analytics
  const analyticsData = document ? {
    documentId: document.id,
    documentName: document.document_name,
    viewerType: useAdobeViewer ? 'adobe' as const : useGoogleViewer ? 'google' as const : 'direct' as const
  } : null;

  const {
    startTracking,
    stopTracking,
    trackPageView,
    trackZoomEvent,
    trackDownloadAttempt,
    trackPrintAttempt,
    logError,
    isTracking
  } = useDocumentAnalytics(analyticsData);

  // Load Adobe configuration and SDK
  useEffect(() => {
    const loadAdobeConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-adobe-config');
        
        if (error) {
          console.error('Error getting Adobe config:', error);
          await logError('adobe_config_failed', error.message);
          return;
        }

        setAdobeClientId(data.clientId);
        setIsDemo(data.isDemo);
      } catch (error) {
        console.error('Error loading Adobe config:', error);
        await logError('adobe_config_exception', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const loadAdobeSDK = async () => {
      if (window.AdobeDC || window.document.querySelector('script[src*="adobe"]')) {
        setAdobeSDKLoaded(true);
        return;
      }

      try {
        const script = window.document.createElement('script');
        script.src = 'https://documentservices.adobe.com/view-sdk/viewer.js';
        script.onload = () => {
          setAdobeSDKLoaded(true);
        };
        script.onerror = async () => {
          console.error('Failed to load Adobe PDF Embed API');
          await logError('adobe_sdk_load_failed', 'Adobe SDK script failed to load');
          setUseAdobeViewer(false);
        };
        window.document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Adobe SDK:', error);
        await logError('adobe_sdk_exception', error instanceof Error ? error.message : 'Unknown error');
        setUseAdobeViewer(false);
      }
    };

    if (isPdf && isOpen) {
      loadAdobeConfig();
      loadAdobeSDK();
    }
  }, [isPdf, isOpen, logError]);

  const getDocumentUrl = async (filePath: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      
      setDocumentUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const renderAdobePDF = async () => {
    if (!adobeViewerRef.current || !documentUrl || !window.AdobeDC || !adobeSDKLoaded) return;

    try {
      // Clear the container
      adobeViewerRef.current.innerHTML = '';

      const adobeDCView = new window.AdobeDC.View({
        clientId: adobeClientId,
        divId: adobeViewerRef.current.id || "adobe-dc-view"
      });

      // Set a unique ID for the viewer container
      if (!adobeViewerRef.current.id) {
        adobeViewerRef.current.id = `adobe-viewer-${Date.now()}`;
      }

      await adobeDCView.previewFile({
        content: { location: { url: documentUrl } },
        metaData: { fileName: document?.document_name || "Document" }
      }, {
        embedMode: "SIZED_CONTAINER",
        showDownloadPDF: true,
        showPrintPDF: true,
        showLeftHandPanel: false,
        showAnnotationTools: false
      });

      // Set up Adobe event listeners for analytics
      adobeDCView.registerCallback(
        window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
        (event: any) => {
          switch (event.type) {
            case 'PAGE_VIEW':
              trackPageView(event.data.pageNumber);
              break;
            case 'ZOOM_IN':
            case 'ZOOM_OUT':
              trackZoomEvent();
              break;
            case 'DOCUMENT_DOWNLOAD':
              trackDownloadAttempt();
              break;
            case 'DOCUMENT_PRINT':
              trackPrintAttempt();
              break;
          }
        },
        { enablePDFAnalytics: true }
      );

    } catch (error) {
      console.error('Adobe PDF viewer error:', error);
      await logError('adobe_render_failed', error instanceof Error ? error.message : 'Adobe render failed');
      setUseAdobeViewer(false);
      setUseGoogleViewer(true);
    }
  };

  const handleViewDocument = async () => {
    if (!document?.file_path) return;
    await getDocumentUrl(document.file_path);
  };

  const downloadDocument = async () => {
    if (!document?.file_path) return;

    try {
      trackDownloadAttempt();
      
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.document_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      await logError('download_failed', error instanceof Error ? error.message : 'Download failed');
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = async () => {
    if (!document?.file_path) return;
    
    const url = await getDocumentUrl(document.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Load document URL when modal opens
  useEffect(() => {
    if (isOpen && document?.file_path && !documentUrl) {
      handleViewDocument();
    }
    if (!isOpen) {
      // Stop tracking when modal closes
      if (isTracking) {
        stopTracking();
      }
      setDocumentUrl(null); // Reset URL when modal closes
      setUseAdobeViewer(true); // Reset to Adobe viewer as default
      setUseGoogleViewer(false);
    }
  }, [isOpen, document?.file_path, documentUrl, isTracking, stopTracking]);

  // Start tracking when document loads and viewer is ready
  useEffect(() => {
    if (isOpen && documentUrl && analyticsData && !isTracking) {
      startTracking();
    }
  }, [isOpen, documentUrl, analyticsData, isTracking, startTracking]);

  // Render Adobe PDF when URL is available
  useEffect(() => {
    if (documentUrl && isPdf && useAdobeViewer && adobeSDKLoaded && isOpen) {
      renderAdobePDF();
    }
  }, [documentUrl, isPdf, useAdobeViewer, adobeSDKLoaded, isOpen]);

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {document.document_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {document.document_type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {document.file_mime_type || 'Unknown type'}
                </Badge>
                {isDemo && (
                  <Badge variant="destructive" className="text-xs">
                    Demo Mode
                  </Badge>
                )}
                {isTracking && (
                  <Badge variant="default" className="text-xs">
                    Analytics Active
                  </Badge>
                )}
                {isPdf && (
                  <Badge variant="outline" className="text-xs">
                    PDF Reader: {useAdobeViewer ? 'Adobe' : useGoogleViewer ? 'Google' : 'Direct'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocument}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading document...</span>
            </div>
          ) : documentUrl ? (
            <div className="h-[70vh] border rounded-lg overflow-hidden relative">
              {isPdf ? (
                <>
                  {useAdobeViewer && adobeSDKLoaded ? (
                    <div 
                      ref={adobeViewerRef}
                      className="w-full h-full"
                      id={`adobe-viewer-${document?.id || 'default'}`}
                    />
                  ) : useGoogleViewer ? (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                      className="w-full h-full border-0"
                      title={document.document_name}
                    />
                  ) : (
                    <iframe
                      src={documentUrl}
                      className="w-full h-full border-0"
                      title={document.document_name}
                      onError={() => {
                        console.log('Direct PDF viewing failed, switching to Adobe viewer');
                        setUseAdobeViewer(true);
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseAdobeViewer(true);
                        setUseGoogleViewer(false);
                      }}
                      className={`text-xs ${useAdobeViewer ? 'bg-primary text-primary-foreground' : ''}`}
                      disabled={!adobeSDKLoaded}
                      title="Adobe PDF Reader (Recommended)"
                    >
                      Adobe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseGoogleViewer(true);
                        setUseAdobeViewer(false);
                      }}
                      className={`text-xs ${useGoogleViewer ? 'bg-primary text-primary-foreground' : ''}`}
                      title="Google Docs Viewer"
                    >
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseAdobeViewer(false);
                        setUseGoogleViewer(false);
                      }}
                      className={`text-xs ${!useAdobeViewer && !useGoogleViewer ? 'bg-primary text-primary-foreground' : ''}`}
                      title="Direct Browser Viewer"
                    >
                      Direct
                    </Button>
                  </div>
                </>
              ) : isImage ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/50">
                  <img
                    src={documentUrl}
                    alt={document.document_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : isWordDoc ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                  <div className="text-center space-y-4">
                    <div className="text-lg font-medium">Word Document Preview</div>
                    <p className="text-muted-foreground max-w-md">
                      Word documents cannot be previewed directly in the browser. 
                      You can download the file or open it in a new tab to view with your system&apos;s default application.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={downloadDocument} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download File
                      </Button>
                      <Button variant="outline" onClick={openInNewTab} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                  <div className="text-center space-y-4">
                    <div className="text-lg font-medium">File Preview Not Available</div>
                    <p className="text-muted-foreground max-w-md">
                      This file type cannot be previewed directly in the browser. 
                      You can download the file to view it with an appropriate application.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={downloadDocument} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download File
                      </Button>
                      <Button variant="outline" onClick={openInNewTab} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Try Opening in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Failed to load document</p>
                <Button onClick={handleViewDocument} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {document.notes && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-1">Notes:</div>
            <div className="text-sm">{document.notes}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}