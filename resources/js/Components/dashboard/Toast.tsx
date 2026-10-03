export function Toast({ message }: { message: string }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg">
            {message}
        </div>
    );
}