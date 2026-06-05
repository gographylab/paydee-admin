'use client'

import { useEffect, useState } from 'react'

interface SwaggerInfo {
    title?: string
    version?: string
    description?: string
}

interface SwaggerServer {
    url: string
    description?: string
}

interface SwaggerOperation {
    summary?: string
    description?: string
    tags?: string[]
}

interface SwaggerPath {
    [method: string]: SwaggerOperation
}

interface SwaggerDoc {
    info?: SwaggerInfo
    servers?: SwaggerServer[]
    paths?: {
        [path: string]: SwaggerPath
    }
    components?: {
        schemas?: {
            [schema: string]: any
        }
    }
}

export default function APIDocs() {
    const [swaggerDoc, setSwaggerDoc] = useState<SwaggerDoc | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load swagger documentation
        fetch('/api/docs')
            .then(res => res.json())
            .then(data => {
                setSwaggerDoc(data)
                setLoading(false)
            })
            .catch(error => {
                console.error('Error loading API docs:', error)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading API Documentation...</p>
                </div>
            </div>
        )
    }

    if (!swaggerDoc) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>Failed to load API documentation</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-900 text-white py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold">
                        {swaggerDoc.info?.title || 'Seller Program API'}
                    </h1>
                    <p className="mt-2 text-gray-300">
                        {swaggerDoc.info?.description || 'Complete API documentation for the Seller Program platform'}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Endpoints</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(swaggerDoc.paths || {}).map(([path, methods]) => (
                                        <div key={path} className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-2">{path}</h4>
                                            <div className="space-y-1">
                                                {Object.entries(methods).map(([method, details]) => (
                                                    <div key={method} className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${method === 'get' ? 'bg-primary-blue-light text-primary-blue' :
                                                            method === 'post' ? 'bg-green-100 text-green-800' :
                                                                method === 'put' ? 'bg-primary-yellow-light text-primary-yellow' :
                                                                    method === 'delete' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {method}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {(details as SwaggerOperation)?.summary || 'No description'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
