"use client"

import { DashboardStats } from "./dashboard-stats"
import { RecentActivity } from "./recent-activity"
import { QuickActions } from "./quick-actions"

interface DashboardOverviewProps {
  onTabChange?: (tab: string) => void
}

export function DashboardOverview({ onTabChange }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitors your lockers management system at a glance</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <QuickActions onTabChange={onTabChange} />
      </div>
    </div>
  )
}
