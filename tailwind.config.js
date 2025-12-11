/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        // 🛡️ 挑発の盾用（ゆっくり点滅）
        'slow-pulse': 'slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        
        // 🟦 プレイ可能カード用（青く呼吸する光）
        'glow-blue': 'glow-blue 2s infinite',
        
        // ⚔️ 攻撃時の突撃モーション（計算した座標へ飛ぶ）
        'attack-thrust': 'attack-thrust 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        
        // 🦅 召喚時の着地モーション（上空からズドン！）
        'summon-land': 'summon-land 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        
        // 📢 プレイ通知用（下から出てフェードアウト）
        'pop-notification': 'pop-notification 1.5s ease-in-out forwards',
      },
      keyframes: {
        'slow-pulse': {
          '0%, 100%': { opacity: '0.5' },
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
          '40%': { transform: 'translate(var(--atk-x), var(--atk-y)) scale(1.1)', zIndex: '50' }, // 敵座標へ！
          '100%': { transform: 'translate(0, 0) scale(1)' }, // 元の位置へ
        },
        'summon-land': {
          '0%': { opacity: '0', transform: 'scale(1.5) translateY(-50px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'pop-notification': {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(0.8)' },
          '10%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-20px) scale(1.05)' }
        }
      }
    },
  },
  plugins: [],
}