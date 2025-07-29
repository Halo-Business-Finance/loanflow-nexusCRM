import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if no input field is focused
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Check for Ctrl/Cmd key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault()
            navigate('/leads')
            break
          case 'k':
            event.preventDefault()
            // Focus on search if available
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
            break
          case '/':
            event.preventDefault()
            // Open global search
            const searchButton = document.querySelector('[data-search-trigger]') as HTMLButtonElement
            if (searchButton) {
              searchButton.click()
            }
            break
          case 'd':
            event.preventDefault()
            navigate('/')
            break
          case 'l':
            event.preventDefault()
            navigate('/leads')
            break
          case 'c':
            event.preventDefault()
            navigate('/clients')
            break
          case 'p':
            event.preventDefault()
            navigate('/pipeline')
            break
          case 'a':
            event.preventDefault()
            navigate('/activities')
            break
        }
      }

      // Single key shortcuts
      switch (event.key) {
        case 'Escape':
          // Close any open modals or clear selections
          const closeButtons = document.querySelectorAll('[data-dialog-close]')
          if (closeButtons.length > 0) {
            (closeButtons[0] as HTMLButtonElement).click()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [navigate])

  return null
}