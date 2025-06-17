'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity
} from 'lucide-react'

interface DayData {
  date: Date
  pnl: number
  trades: number
  volume: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  // Generate mock data for the calendar
  const generateCalendarData = (year: number, month: number): DayData[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startCalendar = new Date(firstDay)
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay())
    
    const endCalendar = new Date(lastDay)
    endCalendar.setDate(endCalendar.getDate() + (6 - lastDay.getDay()))

    const days: DayData[] = []
    const current = new Date(startCalendar)
    const today = new Date()

    while (current <= endCalendar) {
      const isCurrentMonth = current.getMonth() === month
      const baseValue = Math.random() * 2000 - 500 // Random P&L between -500 and 1500
      
      days.push({
        date: new Date(current),
        pnl: isCurrentMonth ? baseValue : 0,
        trades: isCurrentMonth ? Math.floor(Math.random() * 20) + 1 : 0,
        volume: isCurrentMonth ? Math.floor(Math.random() * 50000) + 10000 : 0,
        isCurrentMonth,
        isToday: 
          current.getDate() === today.getDate() &&
          current.getMonth() === today.getMonth() &&
          current.getFullYear() === today.getFullYear()
      })
      
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const calendarData = useMemo(() => 
    generateCalendarData(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  )

  const monthStats = useMemo(() => {
    const currentMonthData = calendarData.filter(day => day.isCurrentMonth)
    const totalPnL = currentMonthData.reduce((sum, day) => sum + day.pnl, 0)
    const totalTrades = currentMonthData.reduce((sum, day) => sum + day.trades, 0)
    const totalVolume = currentMonthData.reduce((sum, day) => sum + day.volume, 0)
    const profitableDays = currentMonthData.filter(day => day.pnl > 0).length
    const totalDays = currentMonthData.filter(day => day.pnl !== 0).length

    return {
      totalPnL,
      totalTrades,
      totalVolume,
      winRate: totalDays > 0 ? (profitableDays / totalDays) * 100 : 0,
      avgDailyPnL: totalDays > 0 ? totalPnL / totalDays : 0
    }
  }, [calendarData])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (pnl < 0) return 'text-rose-600 dark:text-rose-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  const getPnLBgColor = (pnl: number) => {
    if (pnl > 500) return 'bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700'
    if (pnl > 0) return 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
    if (pnl < -300) return 'bg-rose-100 dark:bg-rose-900 border-rose-300 dark:border-rose-700'
    if (pnl < 0) return 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800'
    return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
            Trading Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Daily performance tracking and analysis
          </p>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Monthly P&L</p>
                  <p className={`text-lg font-bold ${getPnLColor(monthStats.totalPnL)}`}>
                    ${monthStats.totalPnL.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 dark:from-violet-950 dark:to-violet-900 dark:border-violet-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Total Trades</p>
                  <p className="text-lg font-bold text-violet-900 dark:text-violet-100">
                    {monthStats.totalTrades.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Win Rate</p>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {monthStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-cyan-950 dark:to-cyan-900 dark:border-cyan-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Avg Daily P&L</p>
                  <p className={`text-lg font-bold ${getPnLColor(monthStats.avgDailyPnL)}`}>
                    ${monthStats.avgDailyPnL.toFixed(0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 dark:from-rose-950 dark:to-rose-900 dark:border-rose-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Volume</p>
                  <p className="text-lg font-bold text-rose-900 dark:text-rose-100">
                    ${(monthStats.totalVolume / 1000).toFixed(0)}K
                  </p>
                </div>
                <Activity className="h-8 w-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                    className={`
                      aspect-square p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md
                      ${day.isCurrentMonth ? getPnLBgColor(day.pnl) : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                      ${day.isToday ? 'ring-2 ring-emerald-500' : ''}
                      ${selectedDay?.date.getTime() === day.date.getTime() ? 'ring-2 ring-violet-500' : ''}
                    `}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div className={`text-sm font-medium ${day.isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>
                        {day.date.getDate()}
                      </div>
                      {day.isCurrentMonth && day.pnl !== 0 && (
                        <div className="text-xs">
                          <div className={`font-bold ${getPnLColor(day.pnl)}`}>
                            ${Math.abs(day.pnl).toFixed(0)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {day.trades} trades
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">
                {selectedDay ? selectedDay.date.toLocaleDateString() : 'Select a day'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {selectedDay ? 'Trading details' : 'Click on a calendar day to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDay ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">P&L</span>
                      <span className={`text-lg font-bold ${getPnLColor(selectedDay.pnl)}`}>
                        ${selectedDay.pnl.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trades</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {selectedDay.trades}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ${selectedDay.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Trade P&L</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ${selectedDay.trades > 0 ? (selectedDay.pnl / selectedDay.trades).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedDay.pnl > 0 ? '100%' : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
                        <span className={`text-sm font-medium ${getPnLColor(selectedDay.pnl)}`}>
                          {selectedDay.volume > 0 ? ((selectedDay.pnl / selectedDay.volume) * 100).toFixed(2) : '0.00'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a day to view trading details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CalendarView