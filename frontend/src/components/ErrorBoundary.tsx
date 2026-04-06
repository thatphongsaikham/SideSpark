'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#1E293B]">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ขออภัยที่เกิดข้อผิดพลาดขึ้น กรุณาลองใหม่อีกครั้ง
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#8A2BE2] hover:bg-[#7C3AED]"
            >
              โหลดหน้าใหม่
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
