import { useState } from 'react'

export interface CustomerData {
    full_name: string
    email: string
    phone: string
    id_card: string
    passport_number: string
    date_of_birth: string
}

const initialCustomer: CustomerData = {
    full_name: '',
    email: '',
    phone: '',
    id_card: '',
    passport_number: '',
    date_of_birth: ''
}

export function useCustomers() {
    const [customers, setCustomers] = useState<CustomerData[]>([initialCustomer])

    const addCustomer = () => {
        setCustomers([...customers, { ...initialCustomer }])
    }

    const removeCustomer = (index: number) => {
        if (customers.length > 1) {
            setCustomers(customers.filter((_, i) => i !== index))
        }
    }

    const updateCustomer = (index: number, field: keyof CustomerData, value: string) => {
        const updated = customers.map((customer, i) => 
            i === index ? { ...customer, [field]: value } : customer
        )
        setCustomers(updated)
    }

    const validateMainCustomer = () => {
        const mainCustomer = customers[0]
        return !!(mainCustomer.full_name && mainCustomer.email && mainCustomer.phone)
    }

    return {
        customers,
        addCustomer,
        removeCustomer,
        updateCustomer,
        validateMainCustomer
    }
}
