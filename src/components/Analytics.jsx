import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = import.meta.env.VITE_GA_ID;

export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;

    // Load gtag script jika belum ada
    if (!document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      // Inisialisasi gtag
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      
      gtag('js', new Date());
      gtag('config', GA_ID, {
        send_page_view: false // Kita kirim manual saat route berubah
      });
    }
  }, []);

  // Kirim page view setiap kali lokasi berubah
  useEffect(() => {
    if (GA_ID && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
};

export default Analytics;
