import React from 'react';

export const LoginDeco = () => {
  return (
    <>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob hidden sm:block"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 hidden sm:block"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 hidden sm:block"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
};

export const LoginHeaderDeco = () => {
  return (
    <div className="flex items-center gap-3 justify-center mt-3 sm:mt-4">
      <div className="h-1 w-8 bg-gradient-to-r from-orange-500 to-transparent"></div>
      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
      <div className="h-1 w-8 bg-gradient-to-l from-amber-500 to-transparent"></div>
    </div>
  );
};
