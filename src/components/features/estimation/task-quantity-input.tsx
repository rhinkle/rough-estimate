import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TaskType {
  id: string
  name: string
  description?: string | null
  defaultMinHours: number
  defaultMaxHours: number
  category?: string | null
  isActive: boolean
}

interface TaskQuantityInputProps {
  taskType: TaskType
  quantity?: number
  customMinHours?: number
  customMaxHours?: number
  onQuantityChange?: (quantity: number) => void
  onCustomHoursChange?: (minHours?: number, maxHours?: number) => void
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function TaskQuantityInput({
  taskType,
  quantity = 1,
  customMinHours,
  customMaxHours,
  onQuantityChange,
  onCustomHoursChange,
  onRemove,
  className,
  disabled = false,
}: TaskQuantityInputProps) {
  const [useCustomHours, setUseCustomHours] = React.useState(
    customMinHours !== undefined || customMaxHours !== undefined
  )

  const [localMinHours, setLocalMinHours] = React.useState(
    customMinHours?.toString() || taskType.defaultMinHours.toString()
  )

  const [localMaxHours, setLocalMaxHours] = React.useState(
    customMaxHours?.toString() || taskType.defaultMaxHours.toString()
  )

  const effectiveMinHours = useCustomHours
    ? (customMinHours ?? taskType.defaultMinHours)
    : taskType.defaultMinHours

  const effectiveMaxHours = useCustomHours
    ? (customMaxHours ?? taskType.defaultMaxHours)
    : taskType.defaultMaxHours

  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const subtotalMin = quantity * effectiveMinHours
  const subtotalMax = quantity * effectiveMaxHours

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0) {
      onQuantityChange?.(newQuantity)
    }
  }

  const handleCustomHoursToggle = () => {
    const newUseCustom = !useCustomHours
    setUseCustomHours(newUseCustom)

    if (newUseCustom) {
      // Enable custom hours - use current values
      const minHours = parseFloat(localMinHours) || taskType.defaultMinHours
      const maxHours = parseFloat(localMaxHours) || taskType.defaultMaxHours
      onCustomHoursChange?.(minHours, maxHours)
    } else {
      // Disable custom hours - revert to defaults
      setLocalMinHours(taskType.defaultMinHours.toString())
      setLocalMaxHours(taskType.defaultMaxHours.toString())
      onCustomHoursChange?.(undefined, undefined)
    }
  }

  const handleMinHoursChange = (value: string) => {
    setLocalMinHours(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      onCustomHoursChange?.(
        numValue,
        customMaxHours ?? taskType.defaultMaxHours
      )
    }
  }

  const handleMaxHoursChange = (value: string) => {
    setLocalMaxHours(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      onCustomHoursChange?.(
        customMinHours ?? taskType.defaultMinHours,
        numValue
      )
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{taskType.name}</CardTitle>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              ×
            </Button>
          )}
        </div>
        {taskType.category && (
          <div className="text-xs text-muted-foreground">
            {taskType.category}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quantity Input */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Quantity</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={disabled || quantity <= 0}
              className="h-8 w-8 p-0"
            >
              -
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={e =>
                handleQuantityChange(parseInt(e.target.value) || 0)
              }
              disabled={disabled}
              className="h-8 w-16 text-center"
              min="0"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              +
            </Button>
          </div>
        </div>

        {/* Hours Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`custom-hours-${taskType.id}`}
              checked={useCustomHours}
              onChange={handleCustomHoursToggle}
              disabled={disabled}
              className="rounded"
            />
            <Label
              htmlFor={`custom-hours-${taskType.id}`}
              className="text-xs font-medium cursor-pointer"
            >
              Custom hours
            </Label>
          </div>

          {useCustomHours ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Min Hours
                </Label>
                <Input
                  type="number"
                  value={localMinHours}
                  onChange={e => handleMinHoursChange(e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                  step="0.5"
                  min="0.1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Max Hours
                </Label>
                <Input
                  type="number"
                  value={localMaxHours}
                  onChange={e => handleMaxHoursChange(e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                  step="0.5"
                  min="0.1"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Default: {formatHours(taskType.defaultMinHours)}-
              {formatHours(taskType.defaultMaxHours)}h each
            </div>
          )}
        </div>

        {/* Subtotal */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Subtotal:</span>
            <span className="font-medium">
              {subtotalMin === subtotalMax
                ? `${formatHours(subtotalMin)}h`
                : `${formatHours(subtotalMin)}-${formatHours(subtotalMax)}h`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
