import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CategoryFilterProps {
  categories: string[]
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  showAllOption?: boolean
  className?: string
}

export function CategoryFilter({
  categories,
  selectedCategory = 'ALL',
  onCategoryChange,
  showAllOption = true,
  className,
}: CategoryFilterProps) {
  const handleCategoryClick = (category: string) => {
    onCategoryChange?.(category)
  }

  if (categories.length === 0 && !showAllOption) {
    return null
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filter by Category</Label>
        <div className="flex flex-wrap gap-2">
          {showAllOption && (
            <Button
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryClick('ALL')}
            >
              All Categories
            </Button>
          )}

          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Button>
          ))}

          {categories.length === 0 && !showAllOption && (
            <p className="text-sm text-muted-foreground">
              No categories available
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
