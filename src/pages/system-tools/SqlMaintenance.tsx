import { SystemToolsLayout } from '@/features/system-administration/components/SystemToolsLayout'
import { SqlMaintenance as SqlMaintenanceComponent } from '@/features/system-administration/system-tools/sql-maintenance'

export default function SqlMaintenance() {
  return (
    <SystemToolsLayout
      toolId="sql-maintenance"
      toolTitle="SQL Maintenance"
      toolDescription="Clean and maintain database tables with comprehensive safety measures, audit trails, and CSV export functionality for all destructive operations."
      showNavigation={false}
    >
      <SqlMaintenanceComponent />
    </SystemToolsLayout>
  )
}