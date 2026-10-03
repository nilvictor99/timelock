<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'TimeLock-v') }}</title>
        <script>
            (function () {
                try {
                    var t = localStorage.getItem('timelock-theme') || 'system';
                    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (d) document.documentElement.classList.add('dark');
                } catch (e) {}
            })();
        </script>
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>