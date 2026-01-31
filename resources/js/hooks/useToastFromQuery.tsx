// hooks/useToastFromQuery.ts
import { useEffect } from 'react';

const useToastFromQuery = () => {
    useEffect(() => {
        const url = new URL(window.location.href);
        const message = url.searchParams.get('toastMessage');
        const type = url.searchParams.get('toastType');
    
        if (message) {
          sessionStorage.setItem('toastMessage', message);
          sessionStorage.setItem('toastType', type ?? 'info');
    
          // Remove query parameters from URL
          url.searchParams.delete('toastMessage');
          url.searchParams.delete('toastType');
    
          const cleanUrl = `${url.pathname}${url.search}`;
          window.history.replaceState({}, '', cleanUrl); // ✅ cleans URL
        }
      }, []);
};

export default useToastFromQuery;
