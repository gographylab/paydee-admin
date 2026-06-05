import { ReactNode, memo } from 'react'

interface SidebarButtonDisabledProps {
  icon: ReactNode
  label: string
  disabledText: string
}

const SidebarButtonDisabled = memo(function SidebarButtonDisabled({ icon, label, disabledText }: SidebarButtonDisabledProps) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-left text-lg font-medium">{label}</span>
      </div>
      <span className="text-sm text-red-500/80">
        {disabledText}
      </span>
    </div>
  )
})

export default SidebarButtonDisabled