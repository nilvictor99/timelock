import * as React from 'react';
import { ImageUp, Loader2, RefreshCw, SwitchCamera, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import {
    classifyCamera,
    classifyCameraError,
    nextCameraIndex,
    pickInitialCamera,
    qrboxFor,
    type CameraDeviceInfo,
    type CameraErrorKind,
    type Facing,
} from '@/lib/camera';

type QrScannerLib = typeof import('html5-qrcode');

type Props = {
    /** Return true when the value was accepted, false to re-arm and keep scanning. */
    onDetected: (value: string) => boolean;
    onError: (kind: CameraErrorKind) => void;
    onInvalidQr: () => void;
};

type Status = 'starting' | 'running' | 'failed';

export default function QrScanner({ onDetected, onError, onInvalidQr }: Props) {
    const { t } = useI18n();
    const readerId = `qr-reader-${React.useId().replace(/:/g, '')}`;

    const libRef = React.useRef<QrScannerLib | null>(null);
    const scannerRef = React.useRef<import('html5-qrcode').Html5Qrcode | null>(null);
    const camerasRef = React.useRef<CameraDeviceInfo[]>([]);
    const activeIndexRef = React.useRef(0);
    const generationRef = React.useRef(0);
    const detectedRef = React.useRef(false);
    const torchOnRef = React.useRef(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const onDetectedRef = React.useRef(onDetected);
    const onErrorRef = React.useRef(onError);
    const onInvalidQrRef = React.useRef(onInvalidQr);

    const [cameras, setCameras] = React.useState<CameraDeviceInfo[]>([]);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [torchSupported, setTorchSupported] = React.useState(false);
    const [torchOn, setTorchOn] = React.useState(false);
    const [status, setStatus] = React.useState<Status>('starting');
    const [busy, setBusy] = React.useState(false);
    const [decoding, setDecoding] = React.useState(false);

    React.useEffect(() => {
        onDetectedRef.current = onDetected;
        onErrorRef.current = onError;
        onInvalidQrRef.current = onInvalidQr;
    }, [onDetected, onError, onInvalidQr]);

    const report = React.useCallback((error: unknown) => {
        const secureContext = typeof window === 'undefined' ? true : window.isSecureContext;
        onErrorRef.current(classifyCameraError(error, { secureContext }));
    }, []);

    const stopCamera = React.useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;
        try {
            await scanner.stop();
        } catch {
            // stop() rejects when the scanner was never running; nothing to release.
        }
    }, []);

    const readTorchSupport = React.useCallback((): boolean => {
        const scanner = scannerRef.current;
        if (!scanner) return false;
        try {
            return scanner.getRunningTrackCameraCapabilities().torchFeature().isSupported();
        } catch {
            // Throws unless a camera is currently scanning.
            return false;
        }
    }, []);

    const handleDecode = React.useCallback((decodedText: string) => {
        if (detectedRef.current) return;
        if (onDetectedRef.current(decodedText)) detectedRef.current = true;
    }, []);

    const startCamera = React.useCallback(
        async (index: number | null) => {
            const scanner = scannerRef.current;
            const lib = libRef.current;
            if (!scanner || !lib) return;

            const generation = ++generationRef.current;
            setStatus('starting');
            setTorchOn(false);
            torchOnRef.current = false;

            if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
                const secureContext = typeof window === 'undefined' ? true : window.isSecureContext;
                setStatus('failed');
                onErrorRef.current(secureContext ? 'unsupported' : 'insecure-context');
                return;
            }

            try {
                if (camerasRef.current.length === 0) {
                    const found = (await lib.Html5Qrcode.getCameras()).map((device) => ({
                        id: device.id,
                        label: device.label,
                    }));
                    if (generation !== generationRef.current) return;

                    camerasRef.current = found;
                    setCameras(found);
                }

                const devices = camerasRef.current;
                if (devices.length === 0) {
                    setStatus('failed');
                    onErrorRef.current('no-camera');
                    return;
                }

                const target = index === null ? pickInitialCamera(devices) : Math.min(index, devices.length - 1);

                // A rejected stop() can leave the previous scan running, and
                // start() then fails on an already-used instance.
                if (scanner.isScanning) await stopCamera();

                // Selected by device id rather than by `facingMode`: browsers fall
                // back to some default camera when the requested facing mode is
                // absent, so `facingMode: 'environment'` picks a camera at the
                // browser's discretion instead of ours.
                await scanner.start(
                    devices[target].id,
                    {
                        fps: 15,
                        qrbox: (viewfinderWidth, viewfinderHeight) => qrboxFor(viewfinderWidth, viewfinderHeight),
                        disableFlip: true,
                    },
                    handleDecode,
                    () => undefined,
                );

                if (generation !== generationRef.current) {
                    void stopCamera();
                    return;
                }

                activeIndexRef.current = target;
                setActiveIndex(target);
                setTorchSupported(readTorchSupport());
                setStatus('running');
            } catch (error) {
                if (generation !== generationRef.current) return;
                setStatus('failed');
                report(error);
            }
        },
        [handleDecode, readTorchSupport, report, stopCamera],
    );

    React.useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const lib = await import('html5-qrcode');
            if (cancelled) return;

            libRef.current = lib;
            scannerRef.current = new lib.Html5Qrcode(readerId, {
                verbose: false,
                useBarCodeDetectorIfSupported: true,
                formatsToSupport: [lib.Html5QrcodeSupportedFormats.QR_CODE],
            });

            await startCamera(null);
        };

        void boot().catch(report);

        return () => {
            cancelled = true;
            generationRef.current++;
            const scanner = scannerRef.current;
            scannerRef.current = null;
            if (scanner) {
                void scanner
                    .stop()
                    .catch(() => undefined)
                    .finally(() => {
                        try {
                            scanner.clear();
                        } catch {
                            // The container may already be unmounted.
                        }
                    });
            }
        };
    }, [readerId, report, startCamera]);

    React.useEffect(() => {
        let hidden = document.hidden;

        const onVisibility = () => {
            if (document.hidden === hidden) return;
            hidden = document.hidden;

            if (hidden) {
                // Release the device instead of leaving the indicator light on.
                detectedRef.current = false;
                torchOnRef.current = false;
                setTorchOn(false);
                setTorchSupported(false);
                void stopCamera();
            } else if (scannerRef.current) {
                void startCamera(activeIndexRef.current);
            }
        };

        document.addEventListener('visibilitychange', onVisibility);

        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [startCamera, stopCamera]);

    const retryCamera = React.useCallback(() => {
        detectedRef.current = false;
        setBusy(true);
        void startCamera(null).finally(() => setBusy(false));
    }, [startCamera]);

    const switchCamera = React.useCallback(() => {
        const total = camerasRef.current.length;
        if (total <= 1 || busy) return;

        setBusy(true);
        const next = nextCameraIndex(activeIndexRef.current, total);

        void stopCamera()
            .then(() => startCamera(next))
            .finally(() => setBusy(false));
    }, [busy, startCamera, stopCamera]);

    const toggleTorch = React.useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;

        const desired = !torchOnRef.current;

        try {
            const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
            if (!torch.isSupported()) return;
            await torch.apply(desired);
            torchOnRef.current = desired;
            setTorchOn(desired);
        } catch {
            torchOnRef.current = false;
            setTorchOn(false);
        }
    }, []);

    const scanImageFile = React.useCallback(
        async (file: File) => {
            const scanner = scannerRef.current;
            const container = document.getElementById(readerId);
            if (!scanner || !container) return;

            // html5-qrcode refuses a file scan while a camera scan is running
            // ("Cannot start file scan - ongoing camera scan"), so the camera is
            // released first and resumed afterwards.
            const resume = scanner.isScanning;
            if (resume) await stopCamera();

            // scanFile() appends canvases to the container and never removes them,
            // so remember what was already there to clean up after it.
            const existing = new Set(Array.from(container.children));

            try {
                const value = await scanner.scanFile(file);
                if (detectedRef.current) return;
                if (onDetectedRef.current(value)) detectedRef.current = true;
            } catch {
                onInvalidQrRef.current();
            } finally {
                for (const child of Array.from(container.children)) {
                    if (!existing.has(child)) child.remove();
                }
                if (resume && scannerRef.current) await startCamera(activeIndexRef.current);
            }
        },
        [readerId, startCamera, stopCamera],
    );

    const facingLabel = (facing: Facing): string => {
        if (facing === 'front') return t('camera.front');
        if (facing === 'back') return t('camera.back');
        return t('camera.unknown');
    };

    const deviceLabel = (device: CameraDeviceInfo | undefined): string =>
        device?.label?.trim() || facingLabel(device ? classifyCamera(device.label) : 'unknown');

    const activeDevice = cameras[activeIndex];
    const nextDevice = cameras[nextCameraIndex(activeIndex, cameras.length)];

    return (
        <div className="space-y-3">
            <div className="relative">
                <div
                    id={readerId}
                    className="aspect-4/3 w-full overflow-hidden rounded-lg bg-black"
                    aria-label={t('camera.viewfinder')}
                />
                {status === 'starting' && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <span className="flex items-center gap-2 text-sm text-white/80">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            {t('camera.starting')}
                        </span>
                    </div>
                )}
            </div>

            <p className="truncate text-center text-xs text-muted-foreground">
                {t('camera.current')}: {deviceLabel(activeDevice)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
                {status === 'failed' && (
                    <Button type="button" disabled={busy} onClick={retryCamera}>
                        <RefreshCw aria-hidden="true" />
                        {t('camera.retry')}
                    </Button>
                )}

                {status !== 'failed' && cameras.length > 1 && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={switchCamera}
                        aria-label={`${t('camera.switchTo')} ${deviceLabel(nextDevice)}`}
                    >
                        <SwitchCamera aria-hidden="true" />
                        {t('camera.switch')}
                    </Button>
                )}

                {torchSupported && (
                    <Button
                        type="button"
                        variant={torchOn ? 'default' : 'outline'}
                        aria-pressed={torchOn}
                        onClick={() => void toggleTorch()}
                    >
                        <Zap aria-hidden="true" />
                        {torchOn ? t('camera.torchOn') : t('camera.torchOff')}
                    </Button>
                )}

                <Button type="button" variant="outline" disabled={decoding} onClick={() => fileInputRef.current?.click()}>
                    <ImageUp aria-hidden="true" />
                    {decoding ? t('camera.decoding') : t('camera.uploadImage')}
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={t('camera.uploadImage')}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        setDecoding(true);
                        void scanImageFile(file).finally(() => setDecoding(false));
                    }}
                />
            </div>
        </div>
    );
}
