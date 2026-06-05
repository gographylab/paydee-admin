// Trip Card Constants
export const TRIP_CARD_CONSTANTS = {
    // Image dimensions
    IMAGE_HEIGHT: 'h-40',
    
    // Text truncation
    TITLE_HEIGHT: 'h-12',
    TITLE_LINES: 'line-clamp-2',
    
    // Default values
    DEFAULT_FLAG: '🌍',
    NO_SCHEDULE_TEXT: 'ยังไม่มีตารางเวลา',
    
    // Button states
    COPY_SUCCESS_TEXT: 'Copied!',
    COPY_DEFAULT_TEXT: 'Share Trip',
    COPY_TIMEOUT: 2000,
    
    // View types
    VIEW_TYPES: {
        SELLER: 'seller' as const,
        GENERAL: 'general' as const
    },
    
    // Labels
    LABELS: {
        TRAVEL_DATES: 'วันที่เดินทาง',
        DURATION: 'ระยะเวลา',
        DEADLINE: 'ปิดรับ',
        AVAILABLE: 'Available',
        MY_SALES: 'My Sales',
        SALES: 'Sales',
        COMMISSION: 'Commission',
        PER_PERSON: 'Per person',
    }
} as const
