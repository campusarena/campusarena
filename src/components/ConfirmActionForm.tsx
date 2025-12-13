'use client';

import type { ReactNode } from 'react';

type ServerAction = (formData: FormData) => void | Promise<void>;

export default function ConfirmActionForm({
  action,
  confirmMessage,
  children,
}: {
  action: ServerAction;
  confirmMessage: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
