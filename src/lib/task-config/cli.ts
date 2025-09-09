#!/usr/bin/env node

import { Command } from 'commander'
import { taskConfiguration } from './index'

const program = new Command()

program
  .name('task-config')
  .description('Task type configuration management')
  .version('1.0.0')

program
  .command('list')
  .description('List all task types')
  .option('-c, --category <category>', 'Filter by category')
  .option('-a, --active-only', 'Show only active task types', false)
  .option('-f, --format <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const taskTypes = await taskConfiguration.listTaskTypes({
        category: options.category,
        active: options.activeOnly ? true : undefined,
      })

      if (options.format === 'json') {
        console.log(JSON.stringify(taskTypes, null, 2))
      } else {
        console.log('\n📋 Task Types')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        if (taskTypes.length === 0) {
          console.log('No task types found.')
          return
        }

        taskTypes.forEach(taskType => {
          const status = taskType.isActive ? '✅' : '❌'
          const category = taskType.category ? ` [${taskType.category}]` : ''
          console.log(`${status} ${taskType.name}${category}`)
          if (taskType.description) {
            console.log(`   ${taskType.description}`)
          }
          console.log(`   Time: ${taskType.defaultMinHours}h - ${taskType.defaultMaxHours}h`)
          console.log('')
        })
      }
    } catch (error) {
      console.error('Error listing task types:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('create')
  .description('Create a new task type')
  .requiredOption('-n, --name <name>', 'Task type name')
  .option('-d, --description <description>', 'Task type description')
  .requiredOption('--min-hours <hours>', 'Default minimum hours', parseFloat)
  .requiredOption('--max-hours <hours>', 'Default maximum hours', parseFloat)
  .option('-c, --category <category>', 'Task category')
  .option('--inactive', 'Create as inactive', false)
  .action(async (options) => {
    try {
      const taskType = await taskConfiguration.createTaskType({
        name: options.name,
        description: options.description,
        defaultMinHours: options.minHours,
        defaultMaxHours: options.maxHours,
        category: options.category,
        isActive: !options.inactive,
      })

      console.log(`✅ Task type '${taskType.name}' created successfully`)
      console.log(`   ID: ${taskType.id}`)
      console.log(`   Hours: ${taskType.defaultMinHours}h - ${taskType.defaultMaxHours}h`)
    } catch (error) {
      console.error('Error creating task type:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('update')
  .description('Update an existing task type')
  .requiredOption('-i, --id <id>', 'Task type ID')
  .option('-n, --name <name>', 'New task type name')
  .option('-d, --description <description>', 'New task type description')
  .option('--min-hours <hours>', 'New default minimum hours', parseFloat)
  .option('--max-hours <hours>', 'New default maximum hours', parseFloat)
  .option('-c, --category <category>', 'New task category')
  .option('--active <active>', 'Set active status (true|false)', (value) => value === 'true')
  .action(async (options) => {
    try {
      const updateData: any = {}
      
      if (options.name) updateData.name = options.name
      if (options.description !== undefined) updateData.description = options.description
      if (options.minHours !== undefined) updateData.defaultMinHours = options.minHours
      if (options.maxHours !== undefined) updateData.defaultMaxHours = options.maxHours
      if (options.category !== undefined) updateData.category = options.category
      if (options.active !== undefined) updateData.isActive = options.active

      const taskType = await taskConfiguration.updateTaskType(options.id, updateData)

      console.log(`✅ Task type '${taskType.name}' updated successfully`)
      console.log(`   Hours: ${taskType.defaultMinHours}h - ${taskType.defaultMaxHours}h`)
    } catch (error) {
      console.error('Error updating task type:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('delete')
  .description('Delete a task type')
  .requiredOption('-i, --id <id>', 'Task type ID')
  .option('--force', 'Skip confirmation', false)
  .action(async (options) => {
    try {
      if (!options.force) {
        const taskType = await taskConfiguration.getTaskType(options.id)
        if (!taskType) {
          console.error('Task type not found')
          process.exit(1)
        }

        console.log(`⚠️  About to delete task type: ${taskType.name}`)
        console.log('Use --force to confirm deletion')
        return
      }

      await taskConfiguration.deleteTaskType(options.id)
      console.log(`✅ Task type deleted successfully`)
    } catch (error) {
      console.error('Error deleting task type:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('categories')
  .description('List all task type categories')
  .action(async () => {
    try {
      const categories = await taskConfiguration.getTaskTypeCategories()
      
      console.log('\n📂 Task Type Categories')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (categories.length === 0) {
        console.log('No categories found.')
        return
      }

      categories.forEach(category => {
        console.log(`  • ${category}`)
      })
    } catch (error) {
      console.error('Error listing categories:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

if (require.main === module) {
  program.parse()
}