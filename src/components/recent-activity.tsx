"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar"
import { Clock, User, Grid3X3, PenTool, FileText } from "lucide-react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { useAuth } from "./auth-provider"

interface ActivityItem {
  id: string
  type: "response" | "assignment" | "signature" | "form"
  title: string
  description: string
  timestamp: Date
  studentName?: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth() // Added auth check

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribers: (() => void)[] = []

    // Listen to recent responses
    const responsesQuery = query(collection(db, "responses"), orderBy("submittedAt", "desc"), limit(5))
    const unsubscribeResponses = onSnapshot(
      responsesQuery,
      (snapshot) => {
        const responseActivities: ActivityItem[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: "response",
            title: "New Registration",
            description: `${data.studentData.name} submitted registration form`,
            timestamp: data.submittedAt.toDate(),
            studentName: data.studentData.name,
          }
        })

        setActivities((prev) => {
          const filtered = prev.filter((item) => item.type !== "response")
          return [...responseActivities, ...filtered]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)
        })
      },
      (error) => {
        console.error("[v0] Firestore permission error in recent responses:", error)
      },
    )
    unsubscribers.push(unsubscribeResponses)

    // Listen to recent assignments
    const assignmentsQuery = query(collection(db, "assignments"), orderBy("assignedAt", "desc"), limit(5))
    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const assignmentActivities: ActivityItem[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: "assignment",
            title: "Locker Assigned",
            description: `Locker ${data.lockerId.replace("locker_", "")} assigned`,
            timestamp: data.assignedAt.toDate(),
          }
        })

        setActivities((prev) => {
          const filtered = prev.filter((item) => item.type !== "assignment")
          return [...assignmentActivities, ...filtered]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)
        })
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Firestore permission error in recent assignments:", error)
        setLoading(false)
      },
    )
    unsubscribers.push(unsubscribeAssignments)

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [user]) // Added user dependency

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "response":
        return <User className="h-4 w-4" />
      case "assignment":
        return <Grid3X3 className="h-4 w-4" />
      case "signature":
        return <PenTool className="h-4 w-4" />
      case "form":
        return <FileText className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "response":
        return "bg-blue-500"
      case "assignment":
        return "bg-green-500"
      case "signature":
        return "bg-purple-500"
      case "form":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No recent activity to display</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`${getActivityColor(activity.type)} text-white`}>
                    {getActivityIcon(activity.type)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatTimeAgo(activity.timestamp)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
