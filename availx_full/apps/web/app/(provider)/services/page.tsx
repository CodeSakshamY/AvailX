'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ProviderServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Services</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No services added yet. Add your services to start receiving bookings.
          </p>
          <Button>Add Your First Service</Button>
        </CardContent>
      </Card>
    </div>
  )
}
