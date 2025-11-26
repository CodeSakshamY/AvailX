'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'

export default function ProviderSettingsPage() {
  const [workRadius, setWorkRadius] = useState(10)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2">Work Radius: {workRadius}km</Label>
              <Slider
                value={[workRadius]}
                onValueChange={(value) => setWorkRadius(value[0])}
                min={1}
                max={50}
                step={1}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Set how far you're willing to travel for jobs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Booking Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about new bookings</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" placeholder="Your Business Name" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell customers about yourself" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
