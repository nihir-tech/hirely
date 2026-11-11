import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useSidebar } from './SidebarContext'
import {
  BotIcon,
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  KanbanIcon,
  LayersIcon,
  LogOutIcon,
  PanelLeftIcon,
  PuzzleIcon,
  ShieldIcon,
  UploadIcon,
  XIcon,
} from '../ui/Icons'

interface NavItem {
  label: string
  to?: string
  onClick?: () => void
  match: (pathname: string, search: string) => boolean
  icon: typeof FileTextIcon
  badge?: string
}

export function WorkspaceSidebar() {
  const { user, isOwner, isCompany, signOut } = useAuth()
  const { desktopExpanded, mobileOpen, isLoggedIn, toggleSidebar, setMobileOpen, openCoachAgent } = useSidebar()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search, setMobileOpen])

  if (!isLoggedIn || !user) return null

  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase()

  const workspaceItems: NavItem[] = [
    {
      label: 'My Resumes',
      to: '/dashboard?tab=resumes',
      match: (p, s) => p === '/dashboard' && (!s.includes('tab=') || s.includes('tab=resumes')),
      icon: FileTextIcon,
    },
    {
      label: 'Applications',
      to: '/dashboard?tab=progress',
      match: (p, s) => p === '/dashboard' && s.includes('tab=progress'),
      icon: KanbanIcon,
      badge: 'Pipeline',
    },
    {
      label: 'Saved Versions',
      to: '/dashboard?tab=versions',
      match: (p, s) => p === '/dashboard' && s.includes('tab=versions'),
      icon: LayersIcon,
    },
  ]

  const jobToolsItems: NavItem[] = [
    {
      label: 'Find & Apply Jobs',
      to: '/jobs',
      match: (p) => p === '/jobs',
      icon: BriefcaseIcon,
      badge: 'Live',
    },
    {
      label: 'Analyze Resume',
      to: '/upload',
      match: (p) => p === '/upload' || p.startsWith('/analyze') || p.startsWith('/optimize'),
      icon: UploadIcon,
    },
    {
      label: 'AI Coach Agent',
      onClick: openCoachAgent,
      match: () => false,
      icon: BotIcon,
      badge: 'AI',
    },
    {
      label: 'LinkedIn Extension',
      to: '/extension',
      match: (p) => p === '/extension',
      icon: PuzzleIcon,
    },
  ]

  const roleItems: NavItem[] = [
    ...(isCompany
      ? [
          {
            label: 'Company Shortlist',
            to: '/company',
            match: (p: string) => p === '/company',
            icon: BuildingIcon,
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            label: 'Owner Admin',
            to: '/admin',
            match: (p: string) => p === '/admin',
            icon: ShieldIcon,
          },
        ]
      : []),
  ]

  const renderGroup = (heading: string, items: NavItem[], expanded: boolean) => (
    <div className="space-y-1">
      {expanded && (
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-fg-faint">
          {heading}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon
        const active = item.match(location.pathname, location.search)
        const baseClasses = `w-full flex items-center ${
          expanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'
        } rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
          active
            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/35 shadow-xs'
            : 'text-fg-muted hover:text-fg-strong hover:bg-surface-subtle border border-transparent'
        }`

        if (item.onClick) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              title={expanded ? undefined : item.label}
              className={baseClasses}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 text-brand-400" />
                {expanded && <span className="truncate">{item.label}</span>}
              </span>
              {expanded && item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/25">
                  {item.badge}
                </span>
              )}
            </button>
          )
        }

        return (
          <Link
            key={item.label}
            to={item.to || '/'}
            title={expanded ? undefined : item.label}
            className={baseClasses}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : ''}`} />
              {expanded && <span className="truncate">{item.label}</span>}
            </span>
            {expanded && item.badge && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  item.badge === 'Live'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-surface-subtle text-fg-muted border border-line'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  const renderFooter = (expanded: boolean) => (
    <div className="p-2.5 border-t border-line space-y-2 bg-surface/40">
      {expanded ? (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-surface border border-line">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fg-strong truncate">
                {user.displayName || 'Hirely User'}
              </p>
              <p className="text-[10px] text-fg-muted truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign out"
            className="p-1.5 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void signOut()}
          title={`Sign out (${user.email || 'Account'})`}
          className="w-full flex justify-center p-2 rounded-xl text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      )}

      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden lg:flex w-full items-center justify-center gap-2 px-2.5 py-2 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-xs font-medium text-fg-muted hover:text-fg-strong transition-colors"
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <PanelLeftIcon className="w-4 h-4 shrink-0" />
        {expanded && <span>Collapse Sidebar</span>}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop Docked Collapsible Sidebar */}
      <aside
        aria-label="Workspace Sidebar"
        data-lenis-prevent
        className={`hidden lg:flex flex-col fixed left-0 top-[78px] bottom-0 z-[780] bg-canvas/90 backdrop-blur-xl border-r border-line transition-all duration-200 ${
          desktopExpanded ? 'w-60' : 'w-[68px]'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {renderGroup('Workspace', workspaceItems, desktopExpanded)}
          {renderGroup('Jobs & AI Agent', jobToolsItems, desktopExpanded)}
          {roleItems.length > 0 && renderGroup('Management', roleItems, desktopExpanded)}
        </div>
        {renderFooter(desktopExpanded)}
      </aside>

      {/* Mobile / Tablet Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-canvas border-r border-line shadow-2xl flex flex-col z-10">
            <div className="px-4 py-3.5 border-b border-line flex items-center justify-between bg-surface/60">
              <span className="text-sm font-bold text-fg-strong">Workspace Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg bg-surface border border-line text-fg-muted hover:text-fg-strong"
                aria-label="Close sidebar"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {renderGroup('Workspace', workspaceItems, true)}
              {renderGroup('Jobs & AI Agent', jobToolsItems, true)}
              {roleItems.length > 0 && renderGroup('Management', roleItems, true)}
            </div>
            {renderFooter(true)}
          </aside>
        </div>
      )}
    </>
  )
}

