import { toast } from 'sonner'

export interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function showConfirmDialog({
  title = 'คุณแน่ใจหรือไม่?',
  description,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'default'
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // สำหรับตอนนี้ใช้ confirm() native ก่อน
    // แต่จะแปลงเป็น modal dialog ภายหลัง
    const result = confirm(`${title}\n\n${description}`)
    resolve(result)
  })
}