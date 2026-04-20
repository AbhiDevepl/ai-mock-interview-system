import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { RiDashboardFill } from 'react-icons/ri'
import { BsCameraVideo } from 'react-icons/bs'
import { MdHistory, MdBarChart, MdSettings, MdHelpOutline } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi2'

const navItems = [
  { label: 'Dashboard',       icon: RiDashboardFill, path: '/' },
  { label: 'Start Interview', icon: BsCameraVideo,   path: '/interview' },
  { label: 'History',         icon: MdHistory,       path: '/history' },
  { label: 'Reports',         icon: MdBarChart,      path: '/reports' },
  { label: 'Settings',        icon: MdSettings,      path: '/settings' },
]

const Sidebar = () => {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <aside style={{ width: '210px', minWidth: '210px' }}
      className='flex flex-col h-screen bg-[#16162a] text-white py-6 px-3 sticky top-0 overflow-y-auto'>

      {/* Logo */}
      <div className='flex items-center gap-3 px-3 mb-8 cursor-pointer' onClick={() => navigate('/')}>
        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#5b3ee0] flex items-center justify-center shadow-lg'>
          <HiSparkles size={16} className='text-white' />
        </div>
        <span className='font-bold text-base tracking-tight'>PrepWise AI</span>
      </div>

      {/* Nav items */}
      <nav className='flex flex-col gap-1 flex-1'>
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors duration-150
                ${active
                  ? 'bg-[#7c5cfc]/20 text-white'
                  : 'text-[#8b8fad] hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={18} className={active ? 'text-[#a78bfa]' : ''} />
              {label}
            </motion.button>
          )
        })}
      </nav>

      {/* Current Plan */}
      <div className='mt-4'>
        <div className='bg-[#1e1e38] rounded-2xl p-4 mb-3'>
          <p className='text-[10px] text-[#8b8fad] uppercase tracking-widest mb-1'>Current Plan</p>
          <p className='text-sm font-semibold text-white mb-3'>Pro Plan</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className='w-full py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7c5cfc] to-[#5b3ee0] text-white shadow-md hover:shadow-[#7c5cfc]/30 hover:shadow-lg transition-all'
          >
            Upgrade to Premium
          </motion.button>
        </div>

        {/* Help Center */}
        <button className='flex items-center gap-2 px-3 py-2 text-[#8b8fad] hover:text-white text-sm transition-colors w-full'>
          <MdHelpOutline size={17} />
          Help Center
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
