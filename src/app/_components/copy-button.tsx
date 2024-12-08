import { ClipboardIcon } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

async function copyToClipboardWithMeta(value: string) {
  navigator.clipboard.writeText(value);
}

interface CopyButtonProps extends ButtonProps {
  value: string;
  src?: string;
}

export function CopyButton({
  value,
  className,
  variant = "ghost",
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      size="icon"
      variant={variant}
      className={cn(className)}
      onClick={() => {
        copyToClipboardWithMeta(
          value
          // event
          //   ? {
          //       name: event,
          //       properties: {
          //         code: value,
          //       },
          //     }
          //   : undefined
        );
        setHasCopied(true);
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  );
}
