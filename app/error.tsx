'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Uygulama hatası:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Bir hata oluştu</h1>
        <p className="text-gray-600 mb-6">
          {error.message || 'Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
