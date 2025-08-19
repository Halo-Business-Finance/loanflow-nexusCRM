import { HorizontalNav } from "./HorizontalNav"

interface HorizontalLayoutProps {
  children: React.ReactNode
}

export default function HorizontalLayout({ children }: HorizontalLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <HorizontalNav />
      <main className="min-h-screen pt-8 pb-8 px-6">
        {children}
      </main>
    </div>
  )
}