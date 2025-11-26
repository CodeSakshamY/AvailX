'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, SlidersHorizontal } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string, location?: string) => void
  onFilterClick?: () => void
  placeholder?: string
}

export function SearchBar({
  onSearch,
  onFilterClick,
  placeholder = 'Search for services...',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, location)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-48">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit">Search</Button>
      {onFilterClick && (
        <Button variant="outline" size="icon" onClick={onFilterClick}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}
