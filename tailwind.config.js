/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slow-pulse': 'slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-blue': 'glow-blue 2s infinite',
        'attack-thrust': 'attack-thrust 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        // ★これを追加！召喚時の着地モーション！
        'summon-land': 'summon-land 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
      },
      keyframes: {
        'slow-pulse': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.2' },
        },
        'glow-blue': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)', 
            borderColor: 'rgba(59, 130, 246, 0.5)'
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(59, 130, 246, 1), 0 0 10px rgba(96, 165, 250, 0.8)',
            borderColor: 'rgba(96, 165, 250, 1)'
          },
        },
        'attack-thrust': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '40%': { transform: 'translate(var(--atk-x), var(--atk-y)) scale(1.1)', zIndex: '50' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        // ★これを追加！
        // 「拡大(scale-150) ＆ 上空(-50px) ＆ 透明」から、「定位置 ＆ 実体化」へ！
        'summon-land': {
          '0%': { opacity: '0', transform: 'scale(1.5) translateY(-50px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}