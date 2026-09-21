import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (ref.current && value) {
            void QRCode.toCanvas(ref.current, value, { width: size, margin: 1 });
        }
    }, [value, size]);

    return <canvas ref={ref} className="rounded-lg border border-border" />;
}