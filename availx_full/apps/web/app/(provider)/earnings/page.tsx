'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, Calendar, Wallet } from 'lucide-react'

export default function ProviderEarningsPage() {
  const earnings = {
    today: 2500,
    week: 15000,
    month: 45000,
    total: 125000,
    commission: 4500,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Earnings</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(earnings.today)}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(earnings.week)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(earnings.month)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(earnings.total)}</p>
              </div>
              <Wallet className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span>Gross Earnings (This Month)</span>
              <span className="font-semibold">{formatCurrency(earnings.month)}</span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span>Platform Commission (10%)</span>
              <span className="font-semibold text-destructive">
                - {formatCurrency(earnings.commission)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-primary/5 border-2 border-primary rounded-lg">
              <span className="font-semibold">Net Earnings</span>
              <span className="font-bold text-lg">
                {formatCurrency(earnings.month - earnings.commission)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
