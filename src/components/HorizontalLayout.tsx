import { HorizontalNav } from "./HorizontalNav"

interface HorizontalLayoutProps {
  children: React.ReactNode
}

export default function HorizontalLayout({ children }: HorizontalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNav />
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
}