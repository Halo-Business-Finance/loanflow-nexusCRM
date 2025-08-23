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
      
      {/* Content area with sidebar layout */}
      <div className="flex">
        {/* Folder Sidebar */}
        <FolderSidebar 
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          activeFolder={activeFolder}
        />
        
        {/* Main Content */}
        <main className={`flex-1 min-h-screen pt-8 pb-8 px-6 transition-all duration-300 ${sidebarOpen ? '' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}