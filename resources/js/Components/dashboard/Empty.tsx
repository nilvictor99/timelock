export function Empty({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}