import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    classifyCamera,
    classifyCameraError,
    classifyScanFileError,
    isImageLoadFailure,
    nextCameraIndex,
    pickInitialCamera,
    qrboxFor,
    safeStop,
    shouldRestartCamera,
} from '../../resources/js/lib/camera.ts';

describe('classifyCamera', () => {
    test('detects front-facing labels in English', () => {
        assert.equal(classifyCamera('FaceTime HD Camera'), 'front');
        assert.equal(classifyCamera('HP Wide Vision HD Camera'), 'unknown');
        assert.equal(classifyCamera('camera2 0, facing front'), 'front');
        assert.equal(classifyCamera('user'), 'front');
    });

    test('detects front-facing labels in Spanish', () => {
        assert.equal(classifyCamera('Cámara delantera'), 'front');
        assert.equal(classifyCamera('Camara frontal integrada'), 'front');
    });

    test('detects back-facing labels', () => {
        assert.equal(classifyCamera('camera2 1, facing back'), 'back');
        assert.equal(classifyCamera('Back Camera'), 'back');
        assert.equal(classifyCamera('environment'), 'back');
        assert.equal(classifyCamera('Cámara trasera'), 'back');
    });

    test('prefers front markers over back markers when both appear', () => {
        assert.equal(classifyCamera('front back camera'), 'front');
    });

    test('treats empty and unrecognised labels as unknown', () => {
        assert.equal(classifyCamera(''), 'unknown');
        assert.equal(classifyCamera('OBS Virtual Camera'), 'unknown');
        assert.equal(classifyCamera('Cámara 1'), 'unknown');
    });

    test('is not case sensitive and strips accents', () => {
        assert.equal(classifyCamera('CÁMARA DELANTERA'), 'front');
        assert.equal(classifyCamera('Camara Trasera'), 'back');
    });

    test('survives a null-ish label at runtime', () => {
        assert.equal(classifyCamera(null as unknown as string), 'unknown');
        assert.equal(classifyCamera(undefined as unknown as string), 'unknown');
    });
});

describe('pickInitialCamera', () => {
    test('prefers a back camera on a phone with front first in the list', () => {
        const devices = [
            { id: 'a', label: 'camera2 0, facing front' },
            { id: 'b', label: 'camera2 1, facing back' },
        ];

        assert.equal(pickInitialCamera(devices), 1);
    });

    test('falls back to the first device on a desktop with a single webcam', () => {
        assert.equal(pickInitialCamera([{ id: 'a', label: 'Integrated Webcam' }]), 0);
    });

    test('falls back to the first device when every label is empty', () => {
        const devices = [
            { id: 'a', label: '' },
            { id: 'b', label: '' },
        ];

        assert.equal(pickInitialCamera(devices), 0);
    });

    test('returns 0 for an empty device list', () => {
        assert.equal(pickInitialCamera([]), 0);
    });

    test('uses the first back camera when several are present', () => {
        const devices = [
            { id: 'a', label: 'camera2 0, facing front' },
            { id: 'b', label: 'camera2 1, facing back' },
            { id: 'c', label: 'camera2 2, facing back' },
        ];

        assert.equal(pickInitialCamera(devices), 1);
    });
});

describe('nextCameraIndex', () => {
    test('cycles forwards and wraps around', () => {
        assert.equal(nextCameraIndex(0, 3), 1);
        assert.equal(nextCameraIndex(1, 3), 2);
        assert.equal(nextCameraIndex(2, 3), 0);
    });

    test('always returns 0 when there is at most one camera', () => {
        assert.equal(nextCameraIndex(0, 1), 0);
        assert.equal(nextCameraIndex(0, 0), 0);
    });

    test('recovers from an out-of-range index', () => {
        assert.equal(nextCameraIndex(7, 3), 2);
    });
});

describe('classifyCameraError', () => {
    const secure = { secureContext: true };

    test('maps NotAllowedError to permission-denied', () => {
        const error = new DOMExceptionLike('NotAllowedError');

        assert.equal(classifyCameraError(error, secure), 'permission-denied');
    });

    test('maps SecurityError to permission-denied', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('SecurityError'), secure),
            'permission-denied',
        );
    });

    test('maps NotFoundError to no-camera', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('NotFoundError'), secure),
            'no-camera',
        );
    });

    test('maps DevicesNotFoundError to no-camera', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('DevicesNotFoundError'), secure),
            'no-camera',
        );
    });

    test('maps NotReadableError to in-use', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('NotReadableError'), secure),
            'in-use',
        );
    });

    test('maps OverconstrainedError to not-found', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('OverconstrainedError'), secure),
            'not-found',
        );
    });

    test('reports an insecure context ahead of an unknown error', () => {
        assert.equal(
            classifyCameraError(new DOMExceptionLike('SomeNewError'), { secureContext: false }),
            'insecure-context',
        );
    });

    test('recognises the plain strings html5-qrcode throws', () => {
        assert.equal(
            classifyCameraError('navigator.mediaDevices not supported', secure),
            'unsupported',
        );
        assert.equal(
            classifyCameraError('Unable to query supported devices, unknown error.', secure),
            'unsupported',
        );
        assert.equal(
            classifyCameraError(
                'Camera access is only supported in secure context like https or localhost.',
                secure,
            ),
            'insecure-context',
        );
    });

    test('does not blame permissions for an insecure origin', () => {
        assert.equal(
            classifyCameraError(
                'Camera access is only supported in secure context like https or localhost.',
                { secureContext: false },
            ),
            'insecure-context',
        );
    });

    test('falls back to unknown for unrecognised failures', () => {
        assert.equal(classifyCameraError(new Error('boom'), secure), 'unknown');
        assert.equal(classifyCameraError(undefined, secure), 'unknown');
        assert.equal(classifyCameraError(null, secure), 'unknown');
    });
});

class DOMExceptionLike {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

describe('qrboxFor', () => {
    test('scales with the viewfinder', () => {
        assert.deepEqual(qrboxFor(360, 640), { width: 259, height: 259 });
        assert.deepEqual(qrboxFor(1200, 800), { width: 576, height: 576 });
    });

    test('never shrinks below the 140px floor', () => {
        assert.deepEqual(qrboxFor(150, 150), { width: 140, height: 140 });
    });

    test('returns a sane default for a not-yet-measured viewfinder', () => {
        assert.deepEqual(qrboxFor(0, 0), { width: 250, height: 250 });
        assert.deepEqual(qrboxFor(Number.NaN, 100), { width: 250, height: 250 });
    });
});

describe('classifyScanFileError', () => {
    test('html5-qrcode throws plain strings for these paths, not Errors', () => {
        assert.equal(
            classifyScanFileError('QR code parse error, error = NotFoundException: Could not find QR Code in the given image.'),
            'not-found',
        );
        assert.equal(
            classifyScanFileError('imageFile argument is mandatory and should be instance of File or Blob.'),
            'invalid-file',
        );
        assert.equal(classifyScanFileError('Cannot start file scan - ongoing camera scan'), 'busy');
        assert.equal(classifyScanFileError('Cannot clear while scan is ongoing, close it first.'), 'busy');
    });

    test('falls back to the DOM exception name when there is no message', () => {
        assert.equal(classifyScanFileError(new TypeError('bad argument')), 'invalid-file');
        assert.equal(classifyScanFileError({ name: 'NotFoundError' }), 'not-found');
    });

    test('anything unrecognised stays unknown instead of pretending it is a QR issue', () => {
        assert.equal(classifyScanFileError(new Error('boom')), 'unknown');
        assert.equal(classifyScanFileError(undefined), 'unknown');
    });

    test('a rejected DOM Event means the image load stalled, not a bad QR', () => {
        const stalled = new Event('stalled');
        assert.equal(classifyScanFileError(stalled), 'load-failed');
        assert.equal(classifyScanFileError(new Event('error')), 'load-failed');
    });
});

describe('isImageLoadFailure', () => {
    test('only a plain DOM Event counts; Errors and strings do not', () => {
        assert.equal(isImageLoadFailure(new Event('suspend')), true);
        assert.equal(isImageLoadFailure(new Error('x')), false);
        assert.equal(isImageLoadFailure('Cannot start file scan'), false);
        assert.equal(isImageLoadFailure(null), false);
        assert.equal(isImageLoadFailure(undefined), false);
    });
});

describe('shouldRestartCamera', () => {
    const base = { mounted: true, wasScanning: true, accepted: false };

    test('restarts after a failed image scan while the modal is open', () => {
        assert.equal(shouldRestartCamera(base), true);
    });

    test('never restarts after an accepted code, because the modal is closing', () => {
        assert.equal(shouldRestartCamera({ ...base, accepted: true }), false);
    });

    test('never restarts after unmount, which is what blanked the page', () => {
        assert.equal(shouldRestartCamera({ ...base, mounted: false }), false);
    });

    test('never restarts if the camera was not running in the first place', () => {
        assert.equal(shouldRestartCamera({ ...base, wasScanning: false }), false);
    });
});

describe('safeStop', () => {
    test('never rejects, so a teardown path cannot blank the page', async () => {
        await safeStop(() => Promise.reject('rechazado'));
        await safeStop(async () => {
            throw 'rechazado';
        });
    });

    test('survives the bare string html5-qrcode throws synchronously', async () => {
        // stop() throws before it ever returns a promise, so `.catch()` chained
        // straight onto it never attaches and the throw escapes into React.
        let escaped: unknown = null;
        const teardown = () => safeStop(() => {
            throw 'Cannot stop, scanner is not running or paused.';
        });

        await teardown().catch((cause) => {
            escaped = cause;
        });

        assert.equal(escaped, null);
    });

    test('reports completion so clear() still runs afterwards', async () => {
        let cleared = false;
        await safeStop(() => {
            throw 'boom';
        }).then(() => {
            cleared = true;
        });
        assert.equal(cleared, true);
    });
});
