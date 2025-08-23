import { useState } from "react"
import { HorizontalNav } from "./HorizontalNav"
import { FolderSidebar } from "./FolderSidebar"

interface HorizontalLayoutProps {
  children: React.ReactNode
}

export default function HorizontalLayout({ children }: HorizontalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const handleFolderClick = (folderName: string) => {
    setActiveFolder(folderName)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setTimeout(() => setActiveFolder(null), 300)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <HorizontalNav 
        onFolderClick={handleFolderClick}
        sidebarOpen={sidebarOpen}
        activeFolder={activeFolder}
      />
      
      {/* Content area with proper sticky layout */}
      <div className="relative">
        <div className="flex min-h-screen">
          {/* Folder Sidebar - Always present in DOM when open */}
          {sidebarOpen && (
            <div className="w-80 flex-shrink-0">
              <FolderSidebar 
                isOpen={sidebarOpen}
                onClose={handleCloseSidebar}
                activeFolder={activeFolder}
              />
            </div>
          )}
          
          {/* Main Content - Scrollable */}
          <main className="flex-1 pt-8 pb-8 px-6 overflow-y-auto max-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}