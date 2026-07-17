import * as React from "react";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

const BreadcrumbContext = React.createContext<{
  crumbs: BreadcrumbEntry[];
  setCrumbs: (crumbs: BreadcrumbEntry[]) => void;
}>({ crumbs: [], setCrumbs: () => {} });

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [crumbs, setCrumbs] = React.useState<BreadcrumbEntry[]>([]);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return React.useContext(BreadcrumbContext);
}

export function BreadcrumbSetter({
  trail,
}: {
  trail: BreadcrumbEntry[];
}) {
  const { setCrumbs } = useBreadcrumbContext();
  React.useEffect(() => {
    setCrumbs(trail);
    return () => setCrumbs([]);
  }, [trail, setCrumbs]);
  return null;
}
