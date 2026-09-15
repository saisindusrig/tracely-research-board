import {Button} from "@/components/ui/button"
import Link from "next/link";
import React from 'react'

const DashboardPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <h1 className="text-3xl font-bold text-slate-900">
        ResearchBoard Dashboard 📊
      </h1>
      <p className="text-slate-600">
        This is a separate page managed automatically by Next.js App Router!
      </p>
      

      <Link href="/">
        <Button variant="outline">Back to Home</Button>
      </Link>
    </main>
  )
}

export default DashboardPage