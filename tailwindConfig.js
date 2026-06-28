    tailwind.config = {
      darkMode: ['class', '[data-theme="dark"]'],
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          },
          animation: {
            'float': 'float 3s ease-in-out infinite',
            'float-slow': 'floatSlow 6s ease-in-out infinite',
            'float-delayed': 'floatDelayed 5s ease-in-out infinite',
            'blob': 'blobAnimation 8s ease-in-out infinite',
            'slide-down': 'slideDown 0.5s ease-out',
            'fade-in': 'fadeIn 0.8s ease-out',
          },
        colors: {
            violet: {
              50:  '#f5f3ff',
              100: '#ede9fe',
              600: '#7c3aed',
              700: '#6d28d9',
            },
            indigo: {
              500: '#6366f1',
              600: '#4f46e5',
            }}
,

          keyframes: {
            float: {
              '0%,100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-30px)' },
            },
            floatSlow: {
              '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
              '50%': { transform: 'translateY(-15px) rotate(2deg)' },
            },
            floatDelayed: {
              '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
              '50%': { transform: 'translateY(-22px) rotate(-3deg)' },
            },
            blobAnimation: {
              '0%,100%': { transform: 'translate(0,0) scale(1)' },
              '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
              '66%': { transform: 'translate(-20px,20px) scale(0.9)' },
            },
            slideDown: {
              from: { opacity: '0', transform: 'translateY(-20px)' },
              to: { opacity: '1', transform: 'translateY(0)' },
            },
            fadeIn: {
              from: { opacity: '0' },
              to: { opacity: '1' },
            },
            shakeCard: {
              '0%': { transform: 'translateX(0)' },
              '20%': { transform: 'translateX(-5px) rotate(-1deg)' },
              '40%': { transform: 'translateX(5px) rotate(1deg)' },
              '60%': { transform: 'translateX(-5px) rotate(-1deg)' },
              '80%': { transform: 'translateX(5px) rotate(1deg)' },
              '100%': { transform: 'translateX(0)' },
            },
          },
        },
      },
    };