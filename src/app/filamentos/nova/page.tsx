import { NewFilamentForm } from "./new-filament-form";

export default function NovaCorPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Nova cor de filamento</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Para uma cor que já existe, use &quot;Comprei&quot; na lista.
      </p>

      <div className="mt-6">
        <NewFilamentForm />
      </div>
    </main>
  );
}
