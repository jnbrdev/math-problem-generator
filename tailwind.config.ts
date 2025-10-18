import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'teal-dark': '#016B61',
        'teal-med': '#70B2B2',
        'teal-light': '#9ECFD4',
        'cream': '#E5E9C5',
      },
    },
  },
  plugins: [],
}
export default config