"use client"

import { DashboardStats } from "./dashboard-stats"
import { RecentActivity } from "./recent-activity"
import { QuickActions } from "./quick-actions"
import { LockerManagementOverview } from "./locker-management-overview"

interface DashboardOverviewProps {
  onTabChange?: (tab: string) => void
}

export function DashboardOverview({ onTabChange }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor your locker management system at a glance.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <QuickActions onTabChange={onTabChange} />
        {/* Locker Management Overview Section */}
        <div className="md:col-span-2">
          <LockerManagementOverview />
        </div>
      </div>
    </div>
  )
}
