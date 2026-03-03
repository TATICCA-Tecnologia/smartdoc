"use client";

import { SessionProvider } from "next-auth/react"
import { TRPCReactProvider } from "./trpc-context"
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ModalProvider } from "./modal-context";
import { CompanyProvider } from "./company-context";

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <CompanyProvider>
        <NuqsAdapter>
          <TRPCReactProvider>
            <ModalProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </ModalProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </CompanyProvider>
    </SessionProvider>
  )
}