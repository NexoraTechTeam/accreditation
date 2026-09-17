/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nexora design system — shared with Nexora KMS
        ink: { DEFAULT: '#0F172A', muted: '#64748B', faint: '#94A3B8' },
        surface: { DEFAULT: '#FFFFFF', subtle: '#F8FAFC' },
        edge: { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#3B76F0',
          700: '#2563EB',
          900: '#1E3A8A',
        },
        // Violet is reserved for AI-generated / externally-sourced content
        ai: { 50: '#F5F1FE', 100: '#EDE4FD', 600: '#8B5CF6', 700: '#7C3AED' },
        status: {
          green: '#059669',
          greenBg: '#ECFDF5',
          yellow: '#B45309',
          yellowBg: '#FFFBEB',
          orange: '#C2410C',
          orangeBg: '#FFF7ED',
          red: '#DC2626',
          redBg: '#FEF2F2',
          gray: '#64748B',
          grayBg: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10.5px', '14px'],
      },
    },
  },
  plugins: [],
};
