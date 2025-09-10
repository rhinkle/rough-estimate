#!/usr/bin/env node

import { Command } from 'commander'
import { estimationEngine } from './index'

const program = new Command()

program
  .name('estimation-engine')
  .description('Project estimation calculation engine')
  .version('1.0.0')

program
  .command('calculate')
  .description('Calculate project estimate')
  .requiredOption('-p, --project-id <projectId>', 'Project ID to calculate')
  .option('-f, --format <format>', 'Output format (json|table)', 'json')
  .action(async options => {
    try {
      const estimate = await estimationEngine.calculateProjectEstimate(
        options.projectId
      )

      if (options.format === 'json') {
        console.log(JSON.stringify(estimate, null, 2))
      } else {
        console.log('\n📊 Project Estimation Results')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`Project ID: ${estimate.projectId}`)
        console.log(
          `Total Estimate: ${estimate.totalMinHours}h - ${estimate.totalMaxHours}h`
        )
        console.log(`Calculated At: ${estimate.calculatedAt}`)
        console.log('\nTask Breakdown:')

        estimate.taskBreakdown.forEach(task => {
          console.log(`  • ${task.taskTypeName}`)
          console.log(`    Quantity: ${task.quantity}`)
          console.log(`    Hours: ${task.minHours}h - ${task.maxHours}h each`)
          console.log(
            `    Subtotal: ${task.subtotalMinHours}h - ${task.subtotalMaxHours}h`
          )
          console.log('')
        })
      }
    } catch (error) {
      console.error(
        'Error calculating estimate:',
        error instanceof Error ? error.message : error
      )
      process.exit(1)
    }
  })

program
  .command('recalculate')
  .description('Recalculate and update project totals')
  .requiredOption('-p, --project-id <projectId>', 'Project ID to recalculate')
  .action(async options => {
    try {
      await estimationEngine.recalculateProjectTotals(options.projectId)
      console.log(`✅ Project ${options.projectId} totals recalculated`)
    } catch (error) {
      console.error(
        'Error recalculating:',
        error instanceof Error ? error.message : error
      )
      process.exit(1)
    }
  })

if (require.main === module) {
  program.parse(process.argv)
}
