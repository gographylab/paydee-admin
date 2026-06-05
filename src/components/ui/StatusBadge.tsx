import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva("", {
  variants: {
    variant: {
      pending: "bg-yellow-50 text-primary-yellow border-secondary-yellow hover:bg-yellow-50/80",
      inprogress: "bg-blue-50 text-primary-blue border-secondary-blue hover:bg-blue-50/80",
      approved: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80",
      rejected: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50/80",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50/80",
      default: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50/80"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: string | null
  className?: string
}

const STATUS_LABELS = {
  'pending': 'รอดำเนินการ',
  'inprogress': 'กำลังดำเนินการ',
  'approved': 'ผ่านการยืนยัน',
  'rejected': 'แอดมินยกเลิก',
  'cancelled': 'ลูกค้าายกเลิก'
} as const

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null
  
  const statusKey = status as keyof typeof STATUS_LABELS
  const variant = statusKey in STATUS_LABELS ? statusKey : 'default'
  const label = STATUS_LABELS[statusKey] || status

  return (
    <Badge 
      variant="outline" 
      className={cn(statusBadgeVariants({ variant }), className)}
    >
      {label}
    </Badge>
  )
}
