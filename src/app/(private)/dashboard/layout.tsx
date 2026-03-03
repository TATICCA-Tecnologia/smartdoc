"use client";

import { AppSidebar } from "@/src/shared/components/global/app-sidebar";
import { BreadcrumbContent } from "@/src/shared/components/global/breadcrumb-content";
import { Separator } from "@/src/shared/components/global/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/src/shared/components/global/ui/sidebar";
import { GlobalLoading } from "@/src/shared/components/global/global-loading";
import { BreadcrumbProvider } from "@/src/shared/context/breadcrumb-context";
import { CompanyProvider } from "@/src/shared/context/company-context";
import { NoCompanyAlert } from "@/src/shared/components/global/no-company-alert";
import { useUserCompanies } from "@/src/shared/hook/use-user-companies";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { hasNoCompany } = useUserCompanies();

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <AppSidebar />
        <SidebarInset className="max-h-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <BreadcrumbContent />
            </div>
          </header>
          <div className="flex flex-1 max-h-full overflow-hidden flex-col gap-4 p-4 md:p-6">
            {hasNoCompany && <NoCompanyAlert />}
            {children}
          </div>
        </SidebarInset>
        {/* <GlobalLoading /> */}
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}