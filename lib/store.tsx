"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { seedState } from "@/lib/catalog";
import {
  addToCart as addToCartState,
  commitListing,
  moderateProduct as moderateProductState,
  moderateSeller as moderateSellerState,
  placeOrder as placeOrderState,
  removeFromCart as removeFromCartState,
  sanitizeState,
  setQty as setQtyState,
  STORAGE_KEY,
  type ListingInput,
} from "@/lib/market";
import { clearSessionClips } from "@/lib/session-clips";
import type { DemoState, Role } from "@/lib/types";

interface MarketApi {
  state: DemoState;
  toast: string | null;
  dismissToast: () => void;
  setRole: (role: Role) => void;
  setActingSeller: (id: string) => void;
  addToCart: (productId: string) => boolean;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (input: { division: string; method: string; note: string }) => { ok: true; orderId: string } | { ok: false; error: string };
  reset: () => void;
  saveListing: (args: {
    productId: string | null;
    input: ListingInput;
    poster: string | null;
    newId: string;
  }) => { ok: true; productId: string } | { ok: false; errors: Record<string, string> };
  moderateProduct: (id: string, action: "approve" | "reject" | "hide" | "restore", note?: string) => void;
  moderateSeller: (id: string, action: "approve" | "reject", note?: string) => void;
  setPinned: (productId: string) => void;
}

const MarketContext = createContext<MarketApi | null>(null);
const listeners = new Set<() => void>();
const serverState = seedState();
let memory: DemoState | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function readMemory(): DemoState {
  if (memory) return memory;
  if (typeof window === "undefined") return serverState;
  memory = sanitizeState(readStored()) ?? seedState();
  return memory;
}

function writeMemory(next: DemoState): string | null {
  memory = next;
  let warning: string | null = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    warning = "This browser could not store the demo. It will last until you refresh.";
  }
  emit();
  return warning;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, readMemory, () => serverState);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const api = useMemo<MarketApi>(() => {
    const apply = (next: DemoState, message: string) => {
      const warning = writeMemory(next);
      if (warning) setToast(warning);
      else if (message) setToast(message);
    };
    return {
      state,
      toast,
      dismissToast: () => setToast(null),
      setRole: (role) => apply({ ...readMemory(), role }, ""),
      setActingSeller: (id) => {
        const current = readMemory();
        if (!current.sellers.some((seller) => seller.id === id)) return;
        apply({ ...current, actingSellerId: id }, "");
      },
      addToCart: (productId) => {
        const result = addToCartState(readMemory(), productId);
        apply(result.state, result.message);
        return result.ok;
      },
      setQty: (productId, qty) => {
        const result = setQtyState(readMemory(), productId, qty);
        apply(result.state, result.message);
      },
      removeFromCart: (productId) => {
        const result = removeFromCartState(readMemory(), productId);
        apply(result.state, result.message);
      },
      placeOrder: (input) => {
        const result = placeOrderState(readMemory(), input, new Date().toISOString());
        apply(result.state, result.message);
        return result.ok ? { ok: true, orderId: result.orderId } : { ok: false, error: result.message };
      },
      reset: () => {
        clearSessionClips();
        apply(seedState(), "Demo data reset in this browser.");
      },
      saveListing: ({ productId, input, poster, newId }) => {
        const current = readMemory();
        const result = commitListing(current, {
          sellerId: current.actingSellerId,
          productId,
          newId,
          input,
          poster,
        });
        if (!result.ok) return result;
        apply(result.state, result.message);
        return { ok: true, productId: result.productId };
      },
      moderateProduct: (id, action, note) => {
        const result = moderateProductState(readMemory(), id, action, note);
        apply(result.state, result.message);
      },
      moderateSeller: (id, action, note) => {
        const result = moderateSellerState(readMemory(), id, action, note);
        apply(result.state, result.message);
      },
      setPinned: (productId) => {
        const current = readMemory();
        if (!current.products.some((product) => product.id === productId)) return;
        apply({ ...current, pinnedProductId: productId }, "Pinned listing updated in the demo layout.");
      },
    };
  }, [state, toast]);

  return <MarketContext.Provider value={api}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketApi {
  const value = useContext(MarketContext);
  if (!value) throw new Error("MarketProvider is missing");
  return value;
}

function readStored(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}
