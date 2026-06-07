"use client";

import { useRef, useState } from "react";

import { Calendar, Camera, Check, LoaderIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

type ProfileIdentityCardProps = {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    emailVerified?: boolean | null;
    createdAt?: string | Date | null;
  };
};

function getInitials(name?: string | null) {
  if (!name) {return "U";}
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date?: string | Date | null) {
  if (!date) {return "N/A";}
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfileIdentityCard({ user }: ProfileIdentityCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Avatar uploads are client-side file reads because the account image is stored as a data URL.
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await authClient.updateUser({ image: base64 });
        toast.success("Avatar updated successfully");
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to update avatar");
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center pt-2">
        <div className="group relative">
          <Avatar className="size-28 ring-4 ring-background shadow-lg">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name ?? "User"}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-semibold bg-muted">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
          >
            {isUploadingAvatar ? (
              <LoaderIcon className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold">{user.name || "Unnamed User"}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {user.emailVerified && (
          <Badge variant="secondary" className="mt-3 gap-1">
            <Check className="size-3" />
            Email Verified
          </Badge>
        )}

        <Separator className="my-4 w-full" />
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
