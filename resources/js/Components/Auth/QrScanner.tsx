import * as React from 'react';

type Props = {
    onDetected: (value: string) => void;
    onError: (message: string) => void;
};

export default function QrScanner({ onDetected, onError }: Props) {
    const scannerRef = React.useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
    const elementId = React.useId().replace(/:/g, '');
    const detectedRef = React.useRef(false);
    const onDetectedRef = React.useRef(onDetected);
    const onErrorRef = React.useRef(onError);

    React.useEffect(() => {
        onDetectedRef.current = onDetected;
        onErrorRef.current = onError;
    }, [onDetected, onError]);

    React.useEffect(() => {
        let mounted = true;
        const start = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                if (!mounted) return;
                const scanner = new Html5Qrcode(`qr-reader-${elementId}`);
                scannerRef.current = scanner;
                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
                    (decodedText) => {
                        if (detectedRef.current) return;
                        detectedRef.current = true;
                        onDetectedRef.current(decodedText);
                    },
                    () => undefined,
                );
            } catch {
                if (mounted) onErrorRef.current('camera');
            }
        };
        void start();
        return () => {
            mounted = false;
            const scanner = scannerRef.current;
            scannerRef.current = null;
            if (scanner) void scanner.stop().then(() => scanner.clear()).catch(() => undefined);
        };
    }, [elementId]);

    return (
        <div
            id={`qr-reader-${elementId}`}
            className="min-h-64 w-full overflow-hidden rounded-lg bg-black"
            aria-label="QR scanner"
        />
    );
}