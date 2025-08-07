/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // 🎨 ARTISTIC COLOR PALETTE for enhanced mind mapping
      colors: {
        // Deep midnight blues for Topic nodes
        midnight: {
          50: '#f8fafc',
          100: '#f1f5f9', 
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Enhanced violet/plum range for Case nodes
        plum: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff', 
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Coral/coral range for Task nodes  
        coral: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5', 
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Paper/parchment tones for Literature nodes
        parchment: {
          50: '#fefbf3',
          100: '#faf7f0',
          200: '#f7f3e9',
          300: '#f4f0e6',
          400: '#e6ddd4',
          500: '#d2c7b8',
          600: '#b5a894',
          700: '#9a8b73',
          800: '#7c6e56',
          900: '#5d5143',
        }
      },
      // Enhanced typography for Literature nodes
      fontFamily: {
        'serif': ['"Crimson Text"', '"Times New Roman"', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      // Custom animations for node interactions
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'dash-flow': 'dash-flow 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
        'dash-flow': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '24' },
        }
      },
      // Custom spacing for enhanced layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Enhanced shadows for depth
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-coral': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 20px rgba(217, 119, 6, 0.4)',
        'paper': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      // Custom backdrop blur for glassmorphism effects
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};