import { HiOutlineSquares2X2 } from "react-icons/hi2"
import { PiListDashesBold } from "react-icons/pi"

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
    return (
        <div className="relative bg-gray-800 rounded-full p-1 flex">
            {/* Background slider for selected button */}
            <div
                className={`absolute top-1 bottom-1 bg-white-500 rounded-full transition-all duration-300 ease-in-out ${
                    viewMode === 'grid' ? 'left-1 right-[50%]' : 'left-[50%] right-1'
                }`}
            />

            <button
                onClick={() => onViewModeChange('grid')}
                className={`relative z-10 px-3 py-2 rounded-full transition-colors duration-300 ${
                    viewMode === 'grid'
                        ? 'text-gray-800 bg-white'
                        : 'text-white hover:text-gray-300'
                }`}
            >
                <HiOutlineSquares2X2 className="text-xl" />
            </button>
            <button
                onClick={() => onViewModeChange('list')}
                className={`relative z-10 px-3 py-2 rounded-full transition-colors duration-300 ${
                    viewMode === 'list'
                        ? 'text-gray-800 bg-white'
                        : 'text-white hover:text-gray-300'
                }`}
            >
                <PiListDashesBold className="text-xl" />
            </button>
        </div>
    )
}
