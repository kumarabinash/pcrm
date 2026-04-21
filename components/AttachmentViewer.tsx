'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Attachment } from '@/types/attachment'

interface Props {
  attachment: Attachment | null
  onClose: () => void
}

const AttachmentViewer = ({ attachment, onClose }: Props) => {
  // Allow pinch-zoom while viewer is open by removing maximum-scale from viewport
  useEffect(() => {
    if (!attachment) return
    const meta = document.querySelector('meta[name="viewport"]')
    if (!meta) return
    const original = meta.getAttribute('content') ?? ''
    meta.setAttribute(
      'content',
      original
        .replace(/,?\s*maximum-scale=[^\s,]+/, '')
        .replace(/,?\s*user-scalable=no/, ''),
    )
    return () => meta.setAttribute('content', original)
  }, [attachment])

  if (!attachment) return null

  const isImage = attachment.mimeType.startsWith('image/')

  const content = (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Main content area */}
      {isImage ? (
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'pinch-zoom' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-w-full max-h-full object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'auto' }}
        >
          <iframe
            src={attachment.url}
            className="w-full h-full min-h-full"
            style={{ minHeight: '100%' }}
            title={attachment.fileName}
          />
        </div>
      )}

      {/* Bottom bar — close button + filename */}
      <div
        className="shrink-0 flex flex-col items-center gap-2 px-6 pt-3"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-white/50 text-center truncate max-w-xs">
          {attachment.fileName}
        </p>
        {!isImage && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 underline"
          >
            Open in browser
          </a>
        )}
        <button
          onClick={onClose}
          className="mt-1 px-10 py-3 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 active:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default AttachmentViewer
