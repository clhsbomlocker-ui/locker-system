"use client"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus, Users, Grid3X3 } from "lucide-react"

interface QuickActionsProps {
  onTabChange?: (tab: string) => void
}

export function QuickActions({ onTabChange }: QuickActionsProps) {
  const actions = [
    {
      title: "Create New Form",
      description: "Build a registration form for students",
      icon: <Plus className="h-5 w-5" />,
      action: () => onTabChange?.("forms"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "View Responses",
      description: "Check student registration submissions",
      icon: <Users className="h-5 w-5" />,
      action: () => onTabChange?.("responses"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Assign Lockers",
      description: "Manage locker assignments visually",
      icon: <Grid3X3 className="h-5 w-5" />,
      action: () => onTabChange?.("lockers"),
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow bg-transparent"
              onClick={action.action}
            >
              <div className={`p-2 rounded-md text-white ${action.color}`}>{action.icon}</div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
