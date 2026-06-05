// Format price with Thai Baht symbol
export const formatPrice = (price: number): string => {
    return `฿${price.toLocaleString()}`
}

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        console.error('Failed to copy text:', err)
        return false
    }
}

// Format date for Thai locale
export const formatThaiDate = (date: Date, options: Intl.DateTimeFormatOptions): string => {
    return date.toLocaleDateString('th-TH', options)
}

// Calculate duration between two dates
export const calculateDuration = (departureDate: string, returnDate: string) => {
    const departure = new Date(departureDate)
    const returnDateObj = new Date(returnDate)
    const diffTime = Math.abs(returnDateObj.getTime() - departure.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 เพราะนับวันเดินทางด้วย
    const nights = diffDays - 1
    return { days: diffDays, nights }
}

// Format date range
export const formatDateRange = (departureDate: string, returnDate: string): string => {
    const departure = new Date(departureDate)
    const returnDateObj = new Date(returnDate)
    
    const departureStr = formatThaiDate(departure, {
        day: 'numeric',
        month: 'short'
    })
    const returnStr = formatThaiDate(returnDateObj, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    
    return `${departureStr} - ${returnStr}`
}

// Calculate commission amount
export const calculateCommission = (
    pricePerPerson: number,
    commissionValue: number,
    commissionType: string | null
): number => {
    if (commissionType === 'percentage') {
        return Math.round((pricePerPerson * commissionValue) / 100)
    }
    return commissionValue
}
