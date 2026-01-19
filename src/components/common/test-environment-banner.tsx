'use client';

export function TestEnvironmentBanner() {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 w-full py-3 px-6 flex items-center justify-between shadow-md">
            <span className="text-gray-800 font-semibold text-sm">
                Sandbox Mode
            </span>
            <span className="text-gray-900 font-bold text-sm flex-1 text-center">
                Você está em um ambiente de teste
            </span>
            {/* <button className="border border-gray-800 text-gray-800 px-4 py-1.5 rounded text-sm font-medium hover:bg-white/20 transition-colors">
                Ir para produção
            </button> */}
             <span className="text-gray-800 font-semibold text-sm">
                V1.0.0-beta
            </span>
        </div>
    );
}
