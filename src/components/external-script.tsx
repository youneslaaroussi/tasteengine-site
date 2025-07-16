'use client';

import Script from 'next/script';

export function ExternalScript() {
  return (
    <Script
      id="emrld-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
              var script = document.createElement("script");
              script.async = 1;
              script.src = 'https://emrld.ltd/NDM4MDY0.js?t=438064';
              document.head.appendChild(script);
          })();
        `,
      }}
    />
  );
}