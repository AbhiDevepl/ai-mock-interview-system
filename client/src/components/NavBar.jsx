import React from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import { BsRobot } from 'react-icons/bs'
import { HiOutlineLogout } from 'react-icons/hi'
import { FaUserAstronaut } from 'react-icons/fa'

const NavBar = () => {
    const { userData } = useSelector((state) => state.user)
    return (
        <div className='bg-[#f3f3f3] flex justify-center items-center p-4'>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}

                className='w-full max-w-6xl bg-white rounded-[24px] shadow-sm 
                border-2 border-gray-200 px-8 py-4 flex justify-between items-center relative mx-auto'>
                <div className='flex items-center gap-3 cursor-pointer'>
                    <div className='bg-black text-white p-2 rounded-lg'>
                        <BsRobot size={18} />
                    </div>
                    <h1 className='font-semibold hidden md:block text-lg'>AI Mock Interview</h1>
                </div>
            </motion.div>
        </div>
    )
}

export default NavBar