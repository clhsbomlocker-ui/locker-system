"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { FileText, Grid3X3, Users, LogOut, BarChart3, PenTool, Wrench } from "lucide-react"

import { useAuth } from "./auth-provider"
import { FormBuilder } from "./form-builder"
import { ResponsesManager } from "./responses-manager"
import { LockerManager } from "./locker-manager"
import { LockerManagementOverview } from "./locker-management-overview"
import { DashboardOverview } from "./dashboard-overview"
import { SignatureManager } from "./signature-manager"

export function AdminDashboard(): JSX.Element {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Small helper utilities (kept simple & documented)
  const formUtils = {
    validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    formatDate: (date: Date) => date.toLocaleDateString(),
    // Example metadata encoder (deterministic & readable)
    encodeFormMetadata: (seed = "BOM") => {
      // simple deterministic base64-ish encoding for tiny metadata use-cases
      return Buffer.from(`${seed}:${new Date().toISOString()}`).toString("base64").slice(0, 24)
    },
  }

  const handleLogout = (): void => {
    // prefer promise-based pattern to avoid unnecessary async/await
    logout().catch((err) => {
      console.error("Failed to logout:", err)
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/IMG_0704.jpeg"
              alt="Monitor Logo"
              width={56}
              height={56}
              className="object-contain rounded-sm"
              priority
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.email ?? "Admin"}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Buttons */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>

            <TabsTrigger value="forms" className="flex items-center gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span>Forms</span>
            </TabsTrigger>

            <TabsTrigger value="responses" className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span>Responses</span>
            </TabsTrigger>

            <TabsTrigger value="locker-grid" className="flex items-center gap-2 text-xs sm:text-sm">
              <Grid3X3 className="h-4 w-4" />
              <span>Locker Grid</span>
            </TabsTrigger>

            <TabsTrigger value="locker-management" className="flex items-center gap-2 text-xs sm:text-sm">
              <Wrench className="h-4 w-4" />
              <span>Locker Management</span>
            </TabsTrigger>

            <TabsTrigger value="finance-management" className="flex items-center gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Finance Management</span>
            </TabsTrigger>

            <TabsTrigger value="signature" className="flex items-center gap-2 text-xs sm:text-sm">
              <PenTool className="h-4 w-4" />
              <span>Signatures</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview onTabChange={setActiveTab} />

            {/* Dashboard image */}
            <div className="mt-4 flex justify-center">
              <Image
                src="/IMG_0704.jpeg"
                alt="Dashboard Image"
                width={900}
                height={600}
                className="rounded-xl shadow-md object-cover"
                priority
              />
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <FormBuilder />
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-6">
            <ResponsesManager />
          </TabsContent>

          {/* Locker Grid Tab */}
          <TabsContent value="locker-grid" className="space-y-6">
            <LockerManager />
          </TabsContent>

          {/* Locker Management Tab */}
          <TabsContent value="locker-management" className="space-y-6">
            <LockerManagementOverview />
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance-management" className="space-y-6">
            <div>Finance Management Content</div>
          </TabsContent>

          {/* Signature Tab */}
          <TabsContent value="signature" className="space-y-6">
            <SignatureManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">BOM Locker Management System</h3>
            <p className="text-gray-300 text-sm max-w-2xl mx-auto">Efficient locker management system.</p>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © Chung Ling High School T02 Board of Monitors Locker System. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs mt-2 opacity-50 select-none">Developed since 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
