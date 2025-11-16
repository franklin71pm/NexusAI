import type { SVGProps } from "react";

const darkenColor = (hex: string, percent: number): string => {
    if (!hex || hex.length < 7) return '#000000'; // Return black for invalid hex
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.floor(r * (1 - percent / 100));
    g = Math.floor(g * (1 - percent / 100));
    b = Math.floor(b * (1 - percent / 100));

    const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function OpenFolderIcon(props: SVGProps<SVGSVGElement> & { color?: string }) {
  const { color = '#FFC300', ...rest } = props;
  const gradId = `folder-grad-open-${color.replace('#', '')}`;
  const lighterColor = color;
  const darkerColor = darkenColor(lighterColor, 15);
  const backPanelColor = darkenColor(lighterColor, 25);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...rest}
    >
      <defs>
        <filter id="folder-shadow-open" x="-0.1" y="-0.1" width="1.2" height="1.2">
          <feDropShadow dx="5" dy="10" stdDeviation="5" floodColor="hsl(27 29% 50% / 0.3)" />
        </filter>
        <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={lighterColor} />
          <stop offset="100%" stopColor={darkerColor} />
        </linearGradient>
        <linearGradient id="file-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
      </defs>
      <g filter="url(#folder-shadow-open)" strokeWidth="1.5">
        {/* Back panel */}
        <path d="M22.1,65.6v122.8c0,8.8,7.1,15.9,15.9,15.9h179.9c8.8,0,15.9-7.1,15.9-15.9V89.4c0-8.8-7.1-15.9-15.9-15.9H128l-23.8-23.8H38.1c-8.8,0-15.9,7.1-15.9,15.9Z" fill={backPanelColor} />
        
        {/* Paper inside */}
        <g transform="translate(0, 15)">
            <path 
              d="M 60 45 h 130 v 150 h -130 z" 
              fill="url(#file-grad)" 
              strokeWidth="1"
              transform="rotate(-5, 128, 128)"
            />
            <path d="M 80 70 h 90" stroke="#ccc" strokeWidth="4" strokeLinecap="round" transform="rotate(-5, 128, 128)" />
            <path d="M 80 85 h 90" stroke="#ccc" strokeWidth="4" strokeLinecap="round" transform="rotate(-5, 128, 128)" />
            <path d="M 80 100 h 60" stroke="#ccc" strokeWidth="4" strokeLinecap="round" transform="rotate(-5, 128, 128)" />

            <path 
              d="M 50 40 h 130 v 150 h -130 z" 
              fill="url(#file-grad)" 
              strokeWidth="1"
            />
            <path d="M 70 65 h 90" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
            <path d="M 70 80 h 90" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
            <path d="M 70 95 h 60" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Front panel */}
        <path d="M228,97.3H38.1c-8.8,0-15.9,7.1-15.9,15.9v95.3c0,8.8,7.1,15.9,15.9,15.9H228c8.8,0,15.9-7.1,15.9-15.9V113.2c0-8.8-7.1-15.9-15.9-15.9Z" fill={`url(#${gradId})`} />
      </g>
    </svg>
  );
}

export function ClosedFolderIcon(props: SVGProps<SVGSVGElement> & { color?: string }) {
  const { color = '#FFC300', ...rest } = props;
  const gradId = `folder-grad-closed-${color.replace('#', '')}`;
  const lighterColor = color;
  const darkerColor = darkenColor(lighterColor, 15);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...rest}>
      <defs>
        <filter id="folder-shadow-closed" x="-0.1" y="-0.1" width="1.2" height="1.2">
          <feDropShadow dx="5" dy="10" stdDeviation="5" floodColor="hsl(27 29% 50% / 0.3)" />
        </filter>
        <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={lighterColor} />
          <stop offset="100%" stopColor={darkerColor} />
        </linearGradient>
      </defs>
      <g filter="url(#folder-shadow-closed)" strokeWidth="1.5">
        {/* Main folder body */}
        <path 
          d="M22.1,65.6v122.8c0,8.8,7.1,15.9,15.9,15.9h179.9c8.8,0,15.9-7.1,15.9-15.9V89.4c0-8.8-7.1-15.9-15.9-15.9H128l-23.8-23.8H38.1c-8.8,0-15.9,7.1-15.9,15.9Z" 
          fill={`url(#${gradId})`}
        />
      </g>
    </svg>
  );
}