"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { FileText, Users, Grid3X3, PenTool, TrendingUp } from "lucide-react"
import { collection, query, onSnapshot, where } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { useAuth } from "./auth-provider"

interface DashboardStats {
  totalForms: number
  totalResponses: number
  totalLockers: number
  occupiedLockers: number
  totalSignatures: number
  recentResponses: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    totalResponses: 0,
    totalLockers: 0,
    occupiedLockers: 0,
    totalSignatures: 0,
    recentResponses: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth() // Added auth check

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribers: (() => void)[] = []

    // Listen to forms
    const formsQuery = query(collection(db, "forms"))
    const unsubscribeForms = onSnapshot(
      formsQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalForms: snapshot.size }))
      },
      (error) => {
        console.error("[v0] Firestore permission error in forms:", error)
      },
    )
    unsubscribers.push(unsubscribeForms)

    // Listen to responses
    const responsesQuery = query(collection(db, "responses"))
    const unsubscribeResponses = onSnapshot(
      responsesQuery,
      (snapshot) => {
        const responses = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))

        // Count recent responses (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentCount = responses.filter((response: any) => {
          const submittedAt = response.submittedAt?.toDate ? response.submittedAt.toDate() : response.submittedAt
          return submittedAt && submittedAt > weekAgo
        }).length

        setStats((prev) => ({
          ...prev,
          totalResponses: snapshot.size,
          recentResponses: recentCount,
        }))
      },
      (error) => {
        console.error("[v0] Firestore permission error in responses:", error)
      },
    )
    unsubscribers.push(unsubscribeResponses)

    // Listen to lockers
    const lockersQuery = query(collection(db, "lockers"))
    const unsubscribeLockers = onSnapshot(
      lockersQuery,
      (snapshot) => {
        const lockers = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
        const occupied = lockers.filter((locker: any) => locker.isOccupied).length

        setStats((prev) => ({
          ...prev,
          totalLockers: snapshot.size,
          occupiedLockers: occupied,
        }))
      },
      (error) => {
        console.error("[v0] Firestore permission error in lockers:", error)
      },
    )
    unsubscribers.push(unsubscribeLockers)

    // Listen to assignments with signatures
    const signaturesQuery = query(collection(db, "assignments"), where("signatureUrl", "!=", null))
    const unsubscribeSignatures = onSnapshot(
      signaturesQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalSignatures: snapshot.size }))
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Firestore permission error in signatures:", error)
        setLoading(false)
      },
    )
    unsubscribers.push(unsubscribeSignatures)

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [user]) // Added user dependency

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const occupancyRate = stats.totalLockers > 0 ? (stats.occupiedLockers / stats.totalLockers) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalForms}</div>
          <p className="text-xs text-muted-foreground">Active registration forms</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Student Responses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalResponses}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{stats.recentResponses} this week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locker Occupancy</CardTitle>
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.occupiedLockers}/{stats.totalLockers}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={occupancyRate > 80 ? "destructive" : occupancyRate > 50 ? "default" : "secondary"}>
              {occupancyRate.toFixed(1)}%
            </Badge>
            <span className="text-xs text-muted-foreground">occupied</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Digital Signatures</CardTitle>
          <PenTool className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSignatures}</div>
          <p className="text-xs text-muted-foreground">Completed signatures</p>
        </CardContent>
      </Card>
    </div>
  )
}
