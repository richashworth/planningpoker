import React from 'react'
import Box from '@mui/material/Box'

export default function Logo({ size = 32, sx, ...props }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-label="Planning Poker logo"
      sx={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...sx }}
      {...props}
    >
      {/* Back card */}
      <g transform="rotate(12, 16, 16)">
        <rect x="7" y="3" width="18" height="24" rx="2.5" fill="none" stroke="white" strokeWidth="0.7" strokeOpacity="0.4" />
      </g>
      {/* Front card */}
      <g transform="rotate(-5, 16, 16)">
        <rect x="7" y="4" width="18" height="24" rx="2.5" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.7" />
        {/* Corner rank PP */}
        <text x="10" y="12.5" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="white" letterSpacing="-0.5">PP</text>
        {/* Nautilus spiral — counter-clockwise, tapering */}
        <path d="M23,25 C23,20 21,16 17,15 C13,14 11,17 11,20 C11,23 13,24.5 15,24.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M15,24.5 C17,24.5 18.5,23 18.5,21 C18.5,19.5 17.5,18.5 16.5,18.5 C15.7,18.5 15,19 15,19.8 C15,20.3 15.3,20.7 15.8,20.7" stroke="white" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </g>
    </Box>
  )
}
