"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";

type FlashProps = {
  success?: string;
  error?: string;
  warning?: string;
};

export default function FlashMessages() {
  const { props } = usePage<{ flash: FlashProps }>();
  
  const flash = props.flash;

  useEffect(() => {
   

    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (flash?.warning) toast.warning(flash.warning);
  }, [flash?.success, flash?.error, flash?.warning]);

  return null;
}
