import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Configuration {
  id: string
  key: string
  value: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

interface ConfigurationSettingsProps {
  configurations: Configuration[]
  loading?: boolean
  onUpdateConfiguration?: (key: string, value: string) => void | Promise<void>
  className?: string
}

interface SettingConfig {
  key: string
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'json'
  defaultValue?: string
  options?: string[]
}

// Predefined configuration settings
const SETTING_CONFIGS: SettingConfig[] = [
  {
    key: 'time_unit',
    label: 'Time Unit',
    description: 'Default unit for displaying time estimates',
    type: 'string',
    defaultValue: 'hours',
    options: ['hours', 'days', 'weeks'],
  },
  {
    key: 'rounding_precision',
    label: 'Rounding Precision',
    description: 'Number of decimal places for hour calculations',
    type: 'number',
    defaultValue: '1',
  },
  {
    key: 'export_format',
    label: 'Export Format',
    description: 'Default format for exporting estimates',
    type: 'string',
    defaultValue: 'csv',
    options: ['csv', 'json', 'xlsx'],
  },
  {
    key: 'default_project_status',
    label: 'Default Project Status',
    description: 'Initial status for new projects',
    type: 'string',
    defaultValue: 'DRAFT',
    options: ['DRAFT', 'ACTIVE'],
  },
  {
    key: 'max_tasks_per_project',
    label: 'Max Tasks Per Project',
    description: 'Maximum number of task types allowed per project',
    type: 'number',
    defaultValue: '50',
  },
]

export function ConfigurationSettings({
  configurations,
  loading = false,
  onUpdateConfiguration,
  className,
}: ConfigurationSettingsProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState<
    Record<string, boolean>
  >({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Initialize form data with current configuration values
  React.useEffect(() => {
    const initialData: Record<string, string> = {}

    SETTING_CONFIGS.forEach(config => {
      const existingConfig = configurations.find(c => c.key === config.key)
      initialData[config.key] =
        existingConfig?.value || config.defaultValue || ''
    })

    setFormData(initialData)
  }, [configurations])

  const getCurrentValue = (key: string): string => {
    const config = configurations.find(c => c.key === key)
    return (
      config?.value ||
      SETTING_CONFIGS.find(c => c.key === key)?.defaultValue ||
      ''
    )
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const validateValue = (
    config: SettingConfig,
    value: string
  ): string | undefined => {
    if (config.type === 'number') {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) {
        return 'Must be a valid number'
      }
      if (
        config.key === 'rounding_precision' &&
        (numValue < 0 || numValue > 3)
      ) {
        return 'Must be between 0 and 3'
      }
      if (
        config.key === 'max_tasks_per_project' &&
        (numValue < 1 || numValue > 200)
      ) {
        return 'Must be between 1 and 200'
      }
    }

    if (config.options && !config.options.includes(value)) {
      return `Must be one of: ${config.options.join(', ')}`
    }

    return undefined
  }

  const handleSave = async (key: string) => {
    if (!onUpdateConfiguration) return

    const config = SETTING_CONFIGS.find(c => c.key === key)
    if (!config) return

    const value = formData[key] || ''
    const error = validateValue(config, value)

    if (error) {
      setErrors(prev => ({ ...prev, [key]: error }))
      return
    }

    setIsSubmitting(prev => ({ ...prev, [key]: true }))

    try {
      await onUpdateConfiguration(key, value)
    } catch (error) {
      console.error('Failed to update configuration:', error)
      setErrors(prev => ({ ...prev, [key]: 'Failed to save setting' }))
    } finally {
      setIsSubmitting(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleReset = (key: string) => {
    const config = SETTING_CONFIGS.find(c => c.key === key)
    if (config) {
      handleInputChange(key, config.defaultValue || '')
    }
  }

  const renderInput = (config: SettingConfig) => {
    const value = formData[config.key] || ''
    const error = errors[config.key]
    const submitting = isSubmitting[config.key]

    if (config.options) {
      return (
        <div className="flex flex-wrap gap-2">
          {config.options.map(option => (
            <Button
              key={option}
              type="button"
              variant={value === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInputChange(config.key, option)}
              disabled={loading || submitting}
            >
              {option}
            </Button>
          ))}
        </div>
      )
    }

    return (
      <Input
        type={config.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={e => handleInputChange(config.key, e.target.value)}
        disabled={loading || submitting}
        className={error ? 'border-destructive' : ''}
        step={config.type === 'number' ? '0.1' : undefined}
      />
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Configure global application settings and default values.
            </CardDescription>
          </CardHeader>
        </Card>

        {SETTING_CONFIGS.map(config => {
          const currentValue = getCurrentValue(config.key)
          const formValue = formData[config.key] || ''
          const hasChanged = formValue !== currentValue
          const error = errors[config.key]
          const submitting = isSubmitting[config.key]

          return (
            <Card key={config.key}>
              <CardHeader>
                <CardTitle className="text-base">{config.label}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{config.label}</Label>
                  {renderInput(config)}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                {currentValue && (
                  <div className="text-sm text-muted-foreground">
                    Current value:{' '}
                    <code className="bg-muted px-1 rounded">
                      {currentValue}
                    </code>
                  </div>
                )}
              </CardContent>

              {hasChanged && onUpdateConfiguration && (
                <CardFooter className="flex gap-2">
                  <Button
                    onClick={() => handleSave(config.key)}
                    disabled={loading || submitting || !!error}
                    size="sm"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReset(config.key)}
                    disabled={loading || submitting}
                    size="sm"
                  >
                    Reset
                  </Button>
                </CardFooter>
              )}
            </Card>
          )
        })}

        {/* Additional Configuration Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Changes are saved individually for each setting</p>
              <p>
                • Default values are restored when you click &ldquo;Reset&rdquo;
              </p>
              <p>• Some changes may require a page refresh to take effect</p>
              <p>
                • Configuration is stored in the database and persists across
                sessions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
