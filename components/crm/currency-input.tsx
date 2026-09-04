"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { parseCurrencyInput, formatIndianCurrencyDisplay } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | undefined | null;
  onChange: (val: number) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  id,
  placeholder = "e.g. 1,00,000",
  className,
  disabled = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value !== null && value !== undefined && value > 0) {
        setDisplayValue(formatIndianCurrencyDisplay(value));
      } else if (value === 0) {
        setDisplayValue("");
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const parsed = parseCurrencyInput(raw);
    onChange(parsed);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseCurrencyInput(displayValue);
    onChange(parsed);
    if (parsed > 0) {
      setDisplayValue(formatIndianCurrencyDisplay(parsed));
    } else {
      setDisplayValue("");
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    const parsed = parseCurrencyInput(displayValue);
    if (parsed > 0) {
      setDisplayValue(String(parsed));
    }
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted-foreground font-semibold text-xs pointer-events-none select-none">
        ₹
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn("pl-7 font-medium text-xs tracking-tight", className)}
      />
    </div>
  );
}
