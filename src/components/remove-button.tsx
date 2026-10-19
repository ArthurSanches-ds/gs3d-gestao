"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export type RemoveState = { message?: string };

type Props = {
  action: (state: RemoveState, formData: FormData) => Promise<RemoveState>;
  id: string;
  label: string;
  confirmText: string;
};

const initialState: RemoveState = {};

// Botão de remover com confirmação; mostra o motivo quando o servidor recusa
export function RemoveButton({ action, id, label, confirmText }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Removendo..." : label}
      </Button>
      {state.message && (
        <p role="status" className="text-destructive text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
