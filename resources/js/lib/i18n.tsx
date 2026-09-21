import * as React from 'react';

type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
    es: {
        'nav.dashboard': 'Dashboard',
        'nav.stats': 'Estadísticas',
        'nav.qr': 'QR',
        'nav.profile': 'Perfil',
        'nav.settings': 'Ajustes',
        'nav.logout': 'Salir',
        'landing.hero': 'Control total de tu tiempo',
        'landing.start': 'Comenzar',
        'landing.login': 'Acceder',
        'landing.theme': 'Tema',
        'login.title': 'Iniciar sesión',
        'login.email': 'Correo electrónico',
        'login.password': 'Contraseña',
        'login.remember': 'Recordarme 30 días',
        'login.submit': 'Entrar',
        'login.noAccount': '¿No tienes cuenta?',
        'login.register': 'Regístrate',
        'login.qr': 'Entrar con QR',
        'register.title': 'Crear cuenta',
        'register.name': 'Nombre',
        'register.email': 'Correo electrónico',
        'register.password': 'Contraseña (mín. 12)',
        'register.confirm': 'Confirmar contraseña',
        'register.terms': 'He leído y acepto los términos.',
        'register.submit': 'Crear cuenta',
        'register.hasAccount': '¿Ya tienes cuenta?',
        'register.login': 'Inicia sesión',
        'onboarding.title': 'Configura tu cuenta',
        'onboarding.language': 'Idioma',
        'onboarding.mode': 'Modo',
        'onboarding.free': 'Libre',
        'onboarding.strict': 'Estricto',
        'onboarding.submit': 'Comenzar',
        'onboarding.error': 'No se pudo guardar tu configuración.',
        'dashboard.loading': 'Cargando…',
        'dashboard.pauseActive': 'Pausa activa',
        'dashboard.resumes': 'Se reanuda el',
        'dashboard.points': 'Puntos',
        'dashboard.streak': 'Racha',
        'dashboard.activitiesToday': 'Completadas hoy',
        'dashboard.addActivity': 'Nueva actividad',
        'dashboard.activityTitle': 'Título de la actividad',
        'dashboard.selectCategory': 'Selecciona una categoría',
        'dashboard.pph': 'pts/h',
        'dashboard.save': 'Guardar',
        'dashboard.today': 'Hoy',
        'dashboard.noActivities': 'Sin actividades para hoy.',
        'dashboard.free': 'Libre',
        'dashboard.pts': 'pts',
        'dashboard.complete': 'Completar',
        'dashboard.completed': 'Completada',
        'dashboard.delete': 'Eliminar',
        'dashboard.rewards': 'Recompensas',
        'dashboard.rewardTitle': 'Título de la recompensa',
        'dashboard.rewardCost': 'Costo',
        'dashboard.refresh': 'Actualizar',
        'profile.avatar': 'Avatar',
        'profile.changeAvatar': 'Cambiar foto',
        'profile.changeEmail': 'Cambiar correo',
        'profile.saveEmail': 'Guardar correo',
        'profile.currentPassword': 'Contraseña actual',
        'profile.changePassword': 'Cambiar contraseña',
        'profile.newPassword': 'Nueva contraseña',
        'profile.confirmPassword': 'Confirmar nueva contraseña',
        'profile.savePassword': 'Guardar contraseña',
        'profile.saved': 'Cambios guardados.',
        'profile.error': 'Algo salió mal.',
        'settings.title': 'Ajustes',
        'settings.name': 'Nombre',
        'settings.theme': 'Tema',
        'settings.language': 'Idioma',
        'stats.pointsEarned': 'Puntos ganados',
        'stats.completed': 'Completadas',
        'stats.bestCategory': 'Categoría top',
        'stats.byCategory': 'Por categoría',
        'stats.noData': 'Aún no hay datos.',
        'stats.activities': 'act.',
        'qr.title': 'Sesión QR',
        'qr.explanation': 'Escanea este código con una cámara desde otro dispositivo o pega el token en la pantalla de entrada por QR.',
        'qr.expires': 'Caduca en',
        'qr.refresh': 'Nuevo código',
        'qr.test': 'Probar en este dispositivo',
        'qrlogin.title': 'Entrar con QR',
        'qrlogin.explanation': 'Escanea el código QR que muestra una sesión ya conectada, o pega el token manualmente.',
        'qrlogin.scan': 'Cámara',
        'qrlogin.or': 'o',
        'qrlogin.inputPlaceholder': 'Token QR',
        'qrlogin.submit': 'Confirmar e iniciar sesión',
        'qrlogin.cameraError': 'No se pudo iniciar la cámara.',
        'stats.downloadCsv': 'Exportar CSV',
        'stats.downloadPdf': 'Exportar PDF',
        'stats.last14': 'Últimos 14 días',
    },
    en: {
        'nav.dashboard': 'Dashboard',
        'nav.stats': 'Stats',
        'nav.qr': 'QR',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        'nav.logout': 'Log out',
        'landing.hero': 'Full control of your time',
        'landing.start': 'Get started',
        'landing.login': 'Log in',
        'landing.theme': 'Theme',
        'login.title': 'Sign in',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.remember': 'Remember me for 30 days',
        'login.submit': 'Sign in',
        'login.noAccount': "Don't have an account?",
        'login.register': 'Register',
        'login.qr': 'Sign in with QR',
        'register.title': 'Create account',
        'register.name': 'Name',
        'register.email': 'Email',
        'register.password': 'Password (min 12)',
        'register.confirm': 'Confirm password',
        'register.terms': 'I have read and accept the terms.',
        'register.submit': 'Create account',
        'register.hasAccount': 'Already have an account?',
        'register.login': 'Sign in',
        'onboarding.title': 'Set up your account',
        'onboarding.language': 'Language',
        'onboarding.mode': 'Mode',
        'onboarding.free': 'Free',
        'onboarding.strict': 'Strict',
        'onboarding.submit': 'Get started',
        'onboarding.error': 'Could not save your settings.',
        'dashboard.loading': 'Loading…',
        'dashboard.pauseActive': 'Pause active',
        'dashboard.resumes': 'Resumes on',
        'dashboard.points': 'Points',
        'dashboard.streak': 'Streak',
        'dashboard.activitiesToday': 'Completed today',
        'dashboard.addActivity': 'New activity',
        'dashboard.activityTitle': 'Activity title',
        'dashboard.selectCategory': 'Select a category',
        'dashboard.pph': 'pts/hr',
        'dashboard.save': 'Save',
        'dashboard.today': 'Today',
        'dashboard.noActivities': 'No activities for today.',
        'dashboard.free': 'Free',
        'dashboard.pts': 'pts',
        'dashboard.complete': 'Complete',
        'dashboard.completed': 'Completed',
        'dashboard.delete': 'Delete',
        'dashboard.rewards': 'Rewards',
        'dashboard.rewardTitle': 'Reward title',
        'dashboard.rewardCost': 'Cost',
        'dashboard.refresh': 'Refresh',
        'profile.avatar': 'Avatar',
        'profile.changeAvatar': 'Change photo',
        'profile.changeEmail': 'Change email',
        'profile.saveEmail': 'Save email',
        'profile.currentPassword': 'Current password',
        'profile.changePassword': 'Change password',
        'profile.newPassword': 'New password',
        'profile.confirmPassword': 'Confirm new password',
        'profile.savePassword': 'Save password',
        'profile.saved': 'Changes saved.',
        'profile.error': 'Something went wrong.',
        'settings.title': 'Settings',
        'settings.name': 'Name',
        'settings.theme': 'Theme',
        'settings.language': 'Language',
        'stats.pointsEarned': 'Points earned',
        'stats.completed': 'Completed',
        'stats.bestCategory': 'Top category',
        'stats.byCategory': 'By category',
        'stats.noData': 'No data yet.',
        'stats.activities': 'act.',
        'qr.title': 'QR session',
        'qr.explanation': 'Scan this code with a camera on another device, or paste the token into the QR sign-in screen.',
        'qr.expires': 'Expires in',
        'qr.refresh': 'New code',
        'qr.test': 'Test on this device',
        'qrlogin.title': 'Sign in with QR',
        'qrlogin.explanation': 'Scan the QR code shown by a connected session, or paste the token manually.',
        'qrlogin.scan': 'Camera',
        'qrlogin.or': 'or',
        'qrlogin.inputPlaceholder': 'QR token',
        'qrlogin.submit': 'Confirm and sign in',
        'qrlogin.cameraError': 'Could not start the camera.',
        'stats.downloadCsv': 'Export CSV',
        'stats.downloadPdf': 'Export PDF',
        'stats.last14': 'Last 14 days',
    },
};

type I18nContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
};

const COOKIE_NAME = 'timelock_locale';

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
    locale,
    children,
}: {
    locale?: string;
    children: React.ReactNode;
}) {
    const [current, setCurrent] = React.useState<Locale>(locale === 'en' ? 'en' : 'es');

    const setLocale = React.useCallback((next: Locale) => {
        setCurrent(next);
        try {
            document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000`;
            document.documentElement.lang = next;
        } catch {
            // ignore
        }
    }, []);

    const t = React.useCallback((key: string) => translations[current][key] ?? key, [current]);

    return (
        <I18nContext.Provider value={{ locale: current, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextValue {
    const context = React.useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}