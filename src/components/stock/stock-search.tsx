"use client";

import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

import styles from "@/features/analysis/analysis-dashboard.module.css";

interface StockSearchProps {
  onAnalyze: (symbol: string) => void;
  disabled?: boolean;
}

export function StockSearch({ onAnalyze, disabled = false }: StockSearchProps) {
  const [symbol, setSymbol] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = symbol.trim().toUpperCase();
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      onAnalyze(normalized);
    }
  }

  return (
    <form className={styles.searchForm} onSubmit={submit}>
      <label className={styles.searchField}>
        <Search size={20} aria-hidden="true" />
        <span className={styles.statusLabel}>ชื่อย่อหุ้น</span>
        <input
          aria-label="ชื่อย่อหุ้น"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          placeholder="เช่น FN, NVDA"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={10}
          disabled={disabled}
        />
      </label>
      <Button type="submit" disabled={disabled || symbol.trim().length === 0}>
        {disabled ? "กำลังวิเคราะห์" : "วิเคราะห์"}
      </Button>
    </form>
  );
}
