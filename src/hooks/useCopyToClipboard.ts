import { useState, useCallback } from 'react'
import { copyToClipboard } from '../utils/tripUtils'
import { TRIP_CARD_CONSTANTS } from '../constants/tripCard'

export function useCopyToClipboard() {
    const [copySuccess, setCopySuccess] = useState(false)

    const handleCopy = useCallback(async (text: string | null) => {
        if (!text) return false

        const success = await copyToClipboard(text)
        
        if (success) {
            setCopySuccess(true)
            setTimeout(() => {
                setCopySuccess(false)
            }, TRIP_CARD_CONSTANTS.COPY_TIMEOUT)
        }
        
        return success
    }, [])

    return {
        copySuccess,
        handleCopy
    }
}
