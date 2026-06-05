import { Tables } from '../../database.types'

export const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

export const calculateCommission = (
    trip: Tables<'trips'>,
    quantity: number = 1
): number => {
    if (!trip) return 0
    
    const commissionPerPerson = trip.commission_type === 'percentage'
        ? (trip.price_per_person * trip.commission_value) / 100
        : trip.commission_value

    return commissionPerPerson * quantity
}

export const calculateTotalAmount = (
    pricePerPerson: number,
    customerCount: number
): number => {
    return pricePerPerson * customerCount
}
