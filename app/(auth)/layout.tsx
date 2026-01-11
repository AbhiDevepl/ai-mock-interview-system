import {ReactNode} from 'react'
import '@/app/globals.css'

const AuthLayout = ({children}: {children: ReactNode}) => {
  return (
    <div className='auth-layout'>{children}</div>
  )
}

export default AuthLayout