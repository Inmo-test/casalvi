import { cn } from '../../lib/cn'

interface BrandLogoProps {
  variant?: 'icon' | 'full'
  className?: string
  width?: number
  theme?: 'default' | 'white' // New prop for color theme
}

export function BrandLogo({ variant = 'full', className, width, theme = 'default' }: BrandLogoProps) {

  // Choose logo source based on theme
  const logoSrc = theme === 'white' ? '/casalvi-logo-white.svg' : '/casalvi-logo-royal.svg'

  // --- VERSIÓN 1: MÓVIL / ICONO (El logo antiguo Indigo) ---
  if (variant === 'icon') {
    return (
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 656 599"
        preserveAspectRatio="xMidYMid meet"
        className={cn("fill-[#007AFF] dark:fill-blue-400", className)}
        style={{ width: width || 40, height: 'auto' }}
      >
        {/* ... (SVG path logic for icon remains same if needed, or update if user wants icon changed too) ... 
            Actually, user only asked for footer logo changes. Leaving icon as is for now unless requested.
        */}
        <g transform="translate(0,599) scale(0.1,-0.1)" stroke="none">
          <path d="M3085 5569 c-108 -25 -153 -44 -294 -124 -33 -19 -241 -189 -306 -249 -16 -16 -50 -45 -75 -65 -25 -20 -47 -38 -50 -41 -7 -8 -201 -174 -339 -290 -62 -52 -124 -105 -139 -118 -92 -79 -401 -343 -443 -377 -44 -37 -173 -147 -214 -184 -45 -40 -237 -205 -264 -227 -13 -10 -31 -26 -40 -34 -9 -9 -45 -40 -81 -70 -136 -114 -200 -183 -233 -250 -30 -62 -32 -71 -32 -180 0 -111 1 -118 33 -180 42 -83 67 -111 142 -159 74 -48 149 -66 243 -58 89 8 168 47 270 133 43 36 81 64 83 61 5 -5 -21 -182 -31 -210 -2 -7 -9 -80 -15 -164 -22 -318 44 -733 160 -998 10 -22 21 -51 25 -65 12 -38 113 -227 165 -305 90 -138 251 -339 316 -394 16 -14 61 -52 99 -86 190 -165 340 -258 600 -369 103 -44 269 -87 425 -111 195 -29 511 -17 710 29 77 17 240 69 240 76 0 3 -84 5 -187 5 -172 1 -197 3 -293 28 -161 42 -308 105 -448 194 -166 105 -377 322 -499 512 -128 202 -251 505 -298 741 -40 199 -47 266 -47 500 0 230 2 251 42 470 8 46 34 152 50 205 38 129 142 380 182 437 10 14 18 29 18 33 0 21 200 292 280 379 57 61 174 162 270 231 176 128 414 231 600 258 96 14 367 14 445 0 228 -42 471 -174 666 -364 232 -226 359 -458 360 -659 1 -130 -6 -163 -62 -274 -25 -48 -28 -61 -17 -74 35 -42 166 -144 231 -178 69 -37 76 -39 168 -39 90 0 99 2 170 37 89 44 135 91 177 178 72 153 45 340 -68 466 -28 32 -239 220 -384 344 -213 181 -253 229 -306 370 -10 26 -15 135 -19 415 -7 430 -5 420 -88 503 -66 66 -108 75 -338 70 -150 -2 -186 -6 -217 -21 -79 -39 -144 -130 -155 -217 -4 -28 -15 -48 -35 -65 -41 -35 -20 -49 -318 210 -63 55 -116 103 -118 108 -2 4 -8 7 -13 7 -5 0 -42 23 -81 52 -92 65 -219 125 -306 143 -74 16 -254 18 -317 4z"></path>
          <path d="M4645 2320 c-151 -23 -253 -94 -360 -250 -100 -145 -114 -163 -183 -234 -175 -180 -367 -279 -610 -313 -99 -15 -129 -15 -230 -4 -243 27 -468 138 -647 320 -33 34 -62 61 -66 61 -7 0 32 -109 68 -190 8 -19 19 -44 23 -55 17 -41 21 -51 33 -70 7 -11 30 -49 51 -85 37 -63 149 -208 217 -281 171 -183 465 -344 720 -395 100 -20 385 -30 444 -15 22 5 63 15 90 22 266 65 475 188 695 409 156 156 254 304 281 425 54 246 -24 461 -214 586 -94 62 -202 86 -312 69z"></path>
        </g>
      </svg>
    )
  }

  // --- VERSIÓN 2: ORDENADOR / FULL (El nuevo logo de texto) ---
  // Color: Negro en light mode, Blanco en dark mode
  return (
    <img
      src={logoSrc}
      alt="Casalvi Logo"
      className={cn("object-contain", className)}
      style={{ width: width || 140, height: 'auto' }}
    />
  )
}
