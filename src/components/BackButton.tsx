"use client";

import { Button } from "react-bootstrap";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
  className?: string;
  forceFallback?: boolean;
};

export default function BackButton({
  label = "← Back",
  fallbackHref = "/",
  className = "btn-sm ca-glass-button mt-3",
  forceFallback = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!forceFallback && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="outline-light"
      size="sm"
      className={className}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}