export type Facing = 'front' | 'back' | 'unknown';

export type CameraDeviceInfo = {
    id: string;
    label: string;
};

export type CameraErrorKind =
    | 'insecure-context'
    | 'no-camera'
    | 'permission-denied'
    | 'in-use'
    | 'not-found'
    | 'unsupported'
    | 'unknown';

const FRONT_MARKERS = [
    'front',
    'user',
    'face',
    'facing front',
    'frontal',
    'delantera',
    'selfie',
    'webcam',
    'integrated',
    'built-in',
    'builtin',
    'internal',
    'facetime',
];

const BACK_MARKERS = ['back', 'rear', 'environment', 'trasera', 'facing back'];

function normalize(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Best-effort facing detection from the device label. This is the only signal
 * available *before* the camera is running: `deviceId` is empty and
 * `track.getCapabilities().facingMode` needs a live track. There is no standard
 * API for it, so this is a heuristic over the strings browsers actually report.
 */
export function classifyCamera(label: string): Facing {
    const normalized = normalize(label ?? '');

    if (normalized === '') return 'unknown';
    if (FRONT_MARKERS.some((marker) => normalized.includes(marker))) return 'front';
    if (BACK_MARKERS.some((marker) => normalized.includes(marker))) return 'back';

    return 'unknown';
}

/**
 * Back camera first: the usual case is scanning a QR shown on another screen,
 * which is held in the user's hands pointed away from them. Falls back to the
 * first device, which on a desktop with a single webcam is the right answer.
 */
export function pickInitialCamera(devices: CameraDeviceInfo[]): number {
    if (devices.length === 0) return 0;

    const back = devices.findIndex((device) => classifyCamera(device.label) === 'back');
    if (back !== -1) return back;

    return 0;
}

export function nextCameraIndex(current: number, total: number): number {
    if (total <= 1) return 0;
    return (current + 1) % total;
}

function errorName(error: unknown): string {
    if (error === null || error === undefined) return '';

    if (typeof error === 'string') return error.toLowerCase();
    if (typeof error !== 'object') return String(error).toLowerCase();

    const name = (error as { name?: unknown }).name;

    return typeof name === 'string' ? name.toLowerCase() : '';
}

function errorMessage(error: unknown): string {
    if (error === null || error === undefined) return '';
    if (typeof error === 'string') return error.toLowerCase();
    if (typeof error !== 'object') return String(error).toLowerCase();

    const message = (error as { message?: unknown }).message;

    return typeof message === 'string' ? message.toLowerCase() : '';
}

/**
 * Turns whatever `getUserMedia` (or html5-qrcode, which throws plain strings in
 * a few paths) rejects with into something the UI can act on. The previous
 * implementation collapsed all of this into "check your permissions", which is
 * wrong for every cause except one.
 */
export function classifyCameraError(
    error: unknown,
    context: { secureContext: boolean },
): CameraErrorKind {
    const name = errorName(error);
    const message = errorMessage(error);

    if (
        name === 'notallowederror' ||
        name === 'permissiondeniederror' ||
        name === 'permissiondismissederror' ||
        name === 'securityerror'
    ) {
        return 'permission-denied';
    }

    if (name === 'notfounderror' || name === 'devicesnotfounderror') {
        return 'no-camera';
    }

    if (name === 'notreadableerror' || name === 'trackstarterror') {
        return 'in-use';
    }

    if (name === 'overconstrainederror' || name === 'constraintnotsatisfiederror') {
        return 'not-found';
    }

    if (!context.secureContext) return 'insecure-context';

    if (name.includes('insecure') || message.includes('secure context')) {
        return 'insecure-context';
    }

    if (
        message.includes('not supported') ||
        message.includes('unable to query') ||
        message.includes('mediadevices not')
    ) {
        return 'unsupported';
    }

    if (message.includes('not found') || message.includes('no camera')) {
        return 'no-camera';
    }

    return 'unknown';
}

/**
 * A square scan region sized to the viewfinder, so it is usable on a 250px
 * phone screen and on a desktop window without a fixed 250px guess.
 */
export function qrboxFor(viewfinderWidth: number, viewfinderHeight: number) {
    const shortest = Math.min(viewfinderWidth, viewfinderHeight);

    if (!Number.isFinite(shortest) || shortest <= 0) {
        return { width: 250, height: 250 };
    }

    const size = Math.max(140, Math.floor(shortest * 0.72));

    return { width: size, height: size };
}
