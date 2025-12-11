/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ★ここから追加！★
      animation: {
        'slow-pulse': 'slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'slow-pulse': {
          '0%, 100%': { opacity: '0.8' }, // 一番濃いとき（さっき決めた濃さ）
          '50%': { opacity: '0.3' },      // 一番薄いとき（じわ〜っと薄くなる）
        }
      }
      // ★ここまで追加！★
    },
  },
  plugins: [],
}