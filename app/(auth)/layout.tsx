import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto w-full md:px-6 lg:px-8">
      <div className="flex h-screen items-center justify-center relative">
        <div className="absolute top-5 left-5">
          <Link
            href="/"
            className={buttonVariants({
              variant: "ghost",
              className: "flex items-center gap-2",
            })}
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
