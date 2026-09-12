import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { ADMIN_EMAILS } from '../config'

export interface AuthState {
  user: User | null
  loading: boolean
  isOwner: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isOwner: false,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isOwner: Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())),
      signIn: async () => {
        if (!auth) throw new Error('Sign-in is not available right now.')
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      signOut: async () => {
        if (auth) await fbSignOut(auth)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}