/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0A84FF',
        'primary-light': '#5AC8FA',
        surface: '#E8F4FD',
        dark: '#1C1C1E',
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        muted: '#8E8E93',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        'sans-medium': ['Inter_500Medium', 'System'],
        'sans-semibold': ['Inter_600SemiBold', 'System'],
        mono: ['SpaceMono', 'Courier'],
      },
    },
  },
  plugins: [],
};
