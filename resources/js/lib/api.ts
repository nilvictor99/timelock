function readXsrfToken(): string | undefined {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
    };
    const xsrf = readXsrfToken();
    if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
    }

    const response = await fetch(url, {
        ...init,
        credentials: 'include',
        headers,
    });

    const data = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
        throw new Error((data as { error?: string } | null)?.error ?? `Error ${response.status}`);
    }

    return data as T;
}

export function apiGet<T>(url: string) {
    return request<T>(url);
}

export function apiPost<T>(url: string, body: unknown) {
    return request<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export function apiPatch<T>(url: string, body: unknown) {
    return request<T>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export function apiDelete<T>(url: string, body?: unknown) {
    return request<T>(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}