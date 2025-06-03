"use client"

import { useEffect, useRef } from 'react';

interface PreviewProps {
  html: string;
  css: string;
  jsx: string;
}

export default function Preview({ html, css, jsx }: PreviewProps) {
  // O código para construir o sourceCode permanece o mesmo...
  const sourceCode = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        
        <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
        
        <script type="text/babel">
          try {
            ${jsx}; /* <--- ADICIONE O PONTO E VÍRGULA AQUI */
          } catch (error) {
            const errorContainer = document.createElement('div');
            errorContainer.style.color = 'red';
            errorContainer.style.fontFamily = 'monospace';
            errorContainer.innerHTML = '<h3>Erro no seu código JSX:</h3><pre>' + error + '</pre>';
            document.body.appendChild(errorContainer);
            console.error(error);
          }
        <\/script>
      </body>
    </html>
  `;

  // O iframe com srcDoc permanece o mesmo
  return (
    <iframe
      srcDoc={sourceCode}
      title="preview"
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}