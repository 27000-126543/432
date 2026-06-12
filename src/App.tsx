import React, { useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import Sidebar, { type PageKey } from '@/components/Layout/Sidebar'
import Header from '@/components/Layout/Header'
import NotificationCenter from '@/components/Layout/NotificationCenter'
import DashboardPage from '@/components/Dashboard/DashboardPage'
import FacilitiesPage from '@/components/Facilities/FacilitiesPage'
import ExchangePage from '@/components/Exchange/ExchangePage'
import GridPage from '@/components/Grid/GridPage'
import GuildPage from '@/components/Guild/GuildPage'
import LeaderboardPage from '@/components/Leaderboard/LeaderboardPage'
import ReportPage from '@/components/Report/ReportPage'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const pages: Record<PageKey, React.FC> = {
  dashboard: DashboardPage,
  facilities: FacilitiesPage,
  exchange: ExchangePage,
  grid: GridPage,
  guild: GuildPage,
  leaderboard: LeaderboardPage,
  report: ReportPage,
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard')
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const tick = useGameStore((s) => s.actions.tick)
  const updateEvery5Seconds = useGameStore((s) => s.actions.updateEvery5Seconds)
  const updateEvery30Seconds = useGameStore((s) => s.actions.updateEvery30Seconds)
  const notifications = useGameStore((s) => s.notifications)
  const tickCount = useGameStore((s) => s.tickCount)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const tickInterval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(tickInterval)
  }, [tick])

  useEffect(() => {
    if (tickCount > 0 && tickCount % 5 === 0) {
      updateEvery5Seconds()
    }
  }, [tickCount, updateEvery5Seconds])

  useEffect(() => {
    if (tickCount > 0 && tickCount % 30 === 0) {
      updateEvery30Seconds()
    }
  }, [tickCount, updateEvery30Seconds])

  const handlePageChange = useCallback((page: PageKey) => {
    setCurrentPage(page)
  }, [])

  const handleToggleNotification = useCallback(() => {
    setIsNotificationOpen((prev) => !prev)
  }, [])

  const handleCloseNotification = useCallback(() => {
    setIsNotificationOpen(false)
  }, [])

  const CurrentPageComponent = pages[currentPage]

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-indigo-950/50 to-purple-950/50">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header
          onToggleNotification={handleToggleNotification}
          unreadCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto">
          <CurrentPageComponent />
        </main>
      </div>

      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={handleCloseNotification}
      />
    </div>
  )
}

export default App
