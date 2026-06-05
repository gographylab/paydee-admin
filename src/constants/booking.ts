export const CONTACT_INFO = {
  phone: {
    number: '02-123-4567',
    display: '📞 โทร 02-123-4567'
  },
  line: {
    url: 'https://line.me/ti/p/@geography',
    display: '💬 แชท LINE'
  }
} as const

export const LINE_OA = {
  id: '@paydeeme',
  url: 'https://line.me/ti/p/@paydeeme',
  displayName: 'PayDeeMe',
  qrImagePath: '/LineOA.png' // Path to QR code image in public folder
} as const

export const SUPPORT_MESSAGES = {
  title: 'ต้องการความช่วยเหลือ?',
  booking: {
    loading: 'กำลังโหลด...',
    loadingData: 'กำลังโหลดข้อมูล...',
    processing: 'กำลังดำเนินการจอง...'
  },
  error: {
    noParams: 'ไม่พบข้อมูล URL',
    noTripData: 'ไม่พบข้อมูลทริปหรือตารางเวลาที่เลือก',
    noTripInfo: 'ไม่พบข้อมูลทริป',
    incompleteForm: 'กรุณากรอกข้อมูลผู้ติดต่อหลักให้ครบถ้วน',
    bookingFailed: 'เกิดข้อผิดพลาดในการจอง'
  }
} as const
