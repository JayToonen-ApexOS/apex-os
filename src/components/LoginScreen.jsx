import React from 'react';
import { Triangle } from 'lucide-react';

export default function LoginScreen({ onSignIn }) {
  return (
    <div className="flex h-screen bg-black text-white items-center justify-center" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex flex-col items-center gap-8 text-center px-6 max-w-sm w-full">
        <div className="flex items-center gap-2.5">
          <Triangle className="w-5 h-5 fill-current text-[#00D4FF]" />
          <span className="font-black tracking-[0.15em] text-lg">APEX</span>
        </div>

        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Welkom terug.</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Jouw persoonlijk productiviteits- en fitnessdashboard.
          </p>
        </div>

        <button
          onClick={onSignIn}
          className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all duration-150 w-full justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Doorgaan met Google
        </button>

        <p className="text-xs text-white/20">Privé — alleen jij hebt toegang tot jouw data.</p>
      </div>
    </div>
  );
}
