import { NavBar } from "@/components/navbar/navbar";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto w-full md:px-6 lg:px-8">
      <NavBar />
      {children}
    </div>
  );
}
