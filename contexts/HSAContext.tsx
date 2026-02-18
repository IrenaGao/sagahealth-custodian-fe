import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Transaction {
  id: string;
  type: "contribution" | "reimbursement" | "investment" | "purchase";
  amount: number;
  description: string;
  date: string;
  category?: string;
  status?: "pending" | "approved" | "denied";
}

export interface Receipt {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  status: "pending" | "unreimbursed" | "paid";
  provider?: string;
}

export interface LinkedCard {
  id: string;
  type: "visa" | "mastercard" | "amex" | "discover";
  last4: string;
  label: string;
  isDefault: boolean;
}

export interface LinkedBankAccount {
  id: string;
  bankName: string;
  accountType: "checking" | "savings";
  last4: string;
  isPrimary: boolean;
}

export interface InvestmentHolding {
  id: string;
  name: string;
  ticker: string;
  allocation: number;
  balance: number;
  returnPercent: number;
  color: string;
}

export interface LoyaltyTier {
  name: "Silver" | "Gold" | "Platinum" | "Diamond";
  threshold: number;
  color: string;
  pointsMultiplier: number;
}

export const loyaltyTiers: LoyaltyTier[] = [
  { name: "Silver", threshold: 4000, color: "#8E9AAF", pointsMultiplier: 1 },
  { name: "Gold", threshold: 10000, color: "#C5A236", pointsMultiplier: 1.5 },
  { name: "Platinum", threshold: 20000, color: "#1A3328", pointsMultiplier: 2 },
  { name: "Diamond", threshold: 50000, color: "#8B2FC9", pointsMultiplier: 2.25 },
];

export function getLoyaltyTier(balance: number): { current: LoyaltyTier | null; next: LoyaltyTier | null; progress: number } {
  let current: LoyaltyTier | null = null;
  let next: LoyaltyTier | null = null;
  for (let i = loyaltyTiers.length - 1; i >= 0; i--) {
    if (balance >= loyaltyTiers[i].threshold) {
      current = loyaltyTiers[i];
      next = i < loyaltyTiers.length - 1 ? loyaltyTiers[i + 1] : null;
      break;
    }
  }
  if (!current) {
    next = loyaltyTiers[0];
    return { current: null, next, progress: balance / next.threshold };
  }
  if (!next) return { current, next: null, progress: 1 };
  return { current, next, progress: (balance - current.threshold) / (next.threshold - current.threshold) };
}

export interface HSAContextValue {
  balance: number;
  investedBalance: number;
  cashBalance: number;
  contributionYTD: number;
  contributionLimit: number;
  transactions: Transaction[];
  receipts: Receipt[];
  holdings: InvestmentHolding[];
  autoInvestEnabled: boolean;
  firstDollarEnabled: boolean;
  roundUpEnabled: boolean;
  loyaltyPoints: number;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  userName: string;
  portfolioIndex: number;
  totalUnreimbursed: number;
  linkedCards: LinkedCard[];
  linkedBankAccounts: LinkedBankAccount[];
  addLinkedCard: (card: Omit<LinkedCard, "id">) => void;
  removeLinkedCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;
  addLinkedBankAccount: (account: Omit<LinkedBankAccount, "id">) => void;
  removeLinkedBankAccount: (accountId: string) => void;
  setPrimaryBankAccount: (accountId: string) => void;
  addContribution: (amount: number) => void;
  addReceipt: (receipt: Omit<Receipt, "id">) => void;
  autoReimburse: (amount: number) => void;
  toggleAutoInvest: () => void;
  toggleFirstDollar: () => void;
  toggleRoundUp: () => void;
  completeOnboarding: (name?: string, portfolioIndex?: number, customTickers?: { ticker: string; name: string; allocation: number }[]) => void;
  buyHolding: (holdingId: string, amount: number) => boolean;
  buyNewTicker: (ticker: string, name: string, amount: number) => boolean;
  sellHolding: (holdingId: string, amount: number) => boolean;
  buyProportional: (amount: number) => boolean;
  sellProportional: (amount: number) => boolean;
  updatePortfolioMix: (newAllocations: { id: string; allocation: number }[]) => void;
  applyPortfolioPreset: (index: number) => void;
  logout: () => void;
}

const HSAContext = createContext<HSAContextValue | null>(null);

const STORAGE_KEY = "saga_health_data";

export const PORTFOLIO_PRESETS = [
  { label: "Conservative", stocks: 20, bonds: 60, cash: 20 },
  { label: "Moderately Conservative", stocks: 40, bonds: 45, cash: 15 },
  { label: "Moderate", stocks: 60, bonds: 30, cash: 10 },
  { label: "Moderately Aggressive", stocks: 75, bonds: 20, cash: 5 },
  { label: "Aggressive", stocks: 90, bonds: 8, cash: 2 },
] as const;

const defaultHoldings: InvestmentHolding[] = [
  { id: "1", name: "Stocks", ticker: "Stocks", allocation: 60, balance: 5130, returnPercent: 12.8, color: "#2E5E3F" },
  { id: "2", name: "Bonds", ticker: "Bonds", allocation: 25, balance: 2137.5, returnPercent: 3.8, color: "#4A8BA8" },
  { id: "3", name: "Cash", ticker: "Cash", allocation: 15, balance: 1282.5, returnPercent: 0.5, color: "#D4A574" },
];

const defaultTransactions: Transaction[] = [
  { id: "t1", type: "contribution", amount: 500, description: "Monthly contribution", date: "2026-02-01", category: "contribution" },
  { id: "t2", type: "purchase", amount: -45.99, description: "CVS Pharmacy", date: "2026-02-03", category: "pharmacy" },
  { id: "t3", type: "reimbursement", amount: 120, description: "Dr. Smith - Copay", date: "2026-01-28", category: "medical" },
  { id: "t4", type: "investment", amount: -250, description: "Auto-invest allocation", date: "2026-02-01", category: "investment" },
  { id: "t5", type: "contribution", amount: 500, description: "Monthly contribution", date: "2026-01-01", category: "contribution" },
  { id: "t6", type: "purchase", amount: -89.00, description: "Zenni Optical", date: "2026-01-15", category: "vision" },
];

const defaultReceipts: Receipt[] = [
  { id: "r1", title: "Annual Physical", amount: 150, date: "2026-02-10", category: "medical", status: "unreimbursed", provider: "Dr. Johnson" },
  { id: "r2", title: "Prescription - Amoxicillin", amount: 25, date: "2026-02-05", category: "pharmacy", status: "unreimbursed", provider: "CVS Pharmacy" },
  { id: "r3", title: "Eye Exam", amount: 89, date: "2026-01-20", category: "vision", status: "unreimbursed", provider: "Zenni Optical" },
  { id: "r4", title: "Dental Cleaning", amount: 120, date: "2026-01-08", category: "dental", status: "paid", provider: "Bright Smile Dental" },
  { id: "r5", title: "Therapy Session", amount: 175, date: "2026-01-14", category: "mental health", status: "unreimbursed", provider: "Dr. Lee" },
  { id: "r6", title: "Lab Work - Blood Panel", amount: 210, date: "2025-12-18", category: "medical", status: "unreimbursed", provider: "Quest Diagnostics" },
  { id: "r7", title: "Prescription - Lisinopril", amount: 15, date: "2025-12-10", category: "pharmacy", status: "paid", provider: "Walgreens" },
  { id: "r8", title: "Urgent Care Visit", amount: 250, date: "2025-12-02", category: "medical", status: "unreimbursed", provider: "MinuteClinic" },
  { id: "r9", title: "Contact Lenses", amount: 185, date: "2025-11-22", category: "vision", status: "unreimbursed", provider: "1-800 Contacts" },
  { id: "r10", title: "Flu Shot", amount: 0, date: "2025-11-05", category: "medical", status: "paid", provider: "CVS Pharmacy" },
  { id: "r11", title: "Physical Therapy", amount: 95, date: "2025-11-12", category: "medical", status: "unreimbursed", provider: "PT Solutions" },
  { id: "r12", title: "Prescription - Atorvastatin", amount: 22, date: "2025-10-28", category: "pharmacy", status: "paid", provider: "CVS Pharmacy" },
  { id: "r13", title: "Dermatology Consult", amount: 180, date: "2025-10-15", category: "medical", status: "unreimbursed", provider: "SkinCare Clinic" },
];

export function HSAProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(12550);
  const [investedBalance, setInvestedBalance] = useState(8550);
  const [contributionYTD, setContributionYTD] = useState(2000);
  const [contributionLimit] = useState(4300);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [receipts, setReceipts] = useState<Receipt[]>(defaultReceipts);
  const [holdings, setHoldings] = useState<InvestmentHolding[]>(defaultHoldings);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(true);
  const [firstDollarEnabled, setFirstDollarEnabled] = useState(true);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [linkedCards, setLinkedCards] = useState<LinkedCard[]>([
    { id: "lc1", type: "visa", last4: "4829", label: "Chase Sapphire", isDefault: true },
  ]);
  const [linkedBankAccounts, setLinkedBankAccounts] = useState<LinkedBankAccount[]>([
    { id: "ba1", bankName: "Chase", accountType: "checking", last4: "7842", isPrimary: true },
  ]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [portfolioIndex, setPortfolioIndex] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let data: Record<string, unknown> | null = null;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) data = JSON.parse(stored);
    } catch (e) {
      console.warn("AsyncStorage load failed:", e);
    }
    if (data) {
      if (data.hasCompletedOnboarding !== undefined) setHasCompletedOnboarding(data.hasCompletedOnboarding as boolean);
      if (data.userName) setUserName(data.userName as string);
      if (data.autoInvestEnabled !== undefined) setAutoInvestEnabled(data.autoInvestEnabled as boolean);
      if (data.firstDollarEnabled !== undefined) setFirstDollarEnabled(data.firstDollarEnabled as boolean);
      if (data.roundUpEnabled !== undefined) setRoundUpEnabled(data.roundUpEnabled as boolean);
      if (typeof data.portfolioIndex === "number" && data.portfolioIndex >= 0 && data.portfolioIndex <= 4) {
        setPortfolioIndex(data.portfolioIndex as number);
      }
    }
    setIsLoading(false);
  };

  const saveData = async (updates: Record<string, unknown>) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
    } catch (e) {
      console.warn("Failed to save data:", e);
    }
  };

  const addContribution = (amount: number) => {
    const newTx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: "contribution",
      amount,
      description: "Manual contribution",
      date: new Date().toISOString().split("T")[0],
      category: "contribution",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setContributionYTD((prev) => prev + amount);
  };

  const addReceipt = (receipt: Omit<Receipt, "id">) => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newReceipt: Receipt = {
      ...receipt,
      id: newId,
      status: "pending" as const,
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    setTimeout(() => {
      setReceipts((prev) =>
        prev.map((r) => (r.id === newId && r.status === "pending" ? { ...r, status: "unreimbursed" as const } : r))
      );
    }, 3000);
  };

  const autoReimburse = (amount: number) => {
    if (amount <= 0) return;
    let remaining = amount;
    setReceipts((prev) => {
      const sorted = [...prev]
        .map((r, idx) => ({ ...r, _idx: idx }))
        .filter((r) => r.status === "unreimbursed")
        .sort((a, b) => a.date.localeCompare(b.date));

      const updated = [...prev];
      for (const r of sorted) {
        if (remaining <= 0) break;
        if (remaining >= r.amount) {
          updated[r._idx] = { ...prev[r._idx], status: "paid" as const };
          remaining -= r.amount;
        }
      }
      return updated;
    });
  };

  const addLinkedCard = (card: Omit<LinkedCard, "id">) => {
    const newCard: LinkedCard = {
      ...card,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    if (newCard.isDefault) {
      setLinkedCards((prev) => [...prev.map((c) => ({ ...c, isDefault: false })), newCard]);
    } else {
      setLinkedCards((prev) => [...prev, newCard]);
    }
  };

  const removeLinkedCard = (cardId: string) => {
    setLinkedCards((prev) => {
      const updated = prev.filter((c) => c.id !== cardId);
      if (updated.length > 0 && !updated.some((c) => c.isDefault)) {
        updated[0].isDefault = true;
      }
      return updated;
    });
  };

  const setDefaultCard = (cardId: string) => {
    setLinkedCards((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === cardId }))
    );
  };

  const addLinkedBankAccount = (account: Omit<LinkedBankAccount, "id">) => {
    const newAccount: LinkedBankAccount = {
      ...account,
      id: "ba" + Date.now().toString() + Math.random().toString(36).substr(2, 4),
    };
    if (newAccount.isPrimary) {
      setLinkedBankAccounts((prev) => [...prev.map((a) => ({ ...a, isPrimary: false })), newAccount]);
    } else {
      setLinkedBankAccounts((prev) => [...prev, newAccount]);
    }
  };

  const removeLinkedBankAccount = (accountId: string) => {
    setLinkedBankAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== accountId);
      if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryBankAccount = (accountId: string) => {
    setLinkedBankAccounts((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === accountId }))
    );
  };

  const toggleAutoInvest = () => {
    setAutoInvestEnabled((prev) => {
      saveData({ autoInvestEnabled: !prev });
      return !prev;
    });
  };

  const toggleFirstDollar = () => {
    setFirstDollarEnabled((prev) => {
      saveData({ firstDollarEnabled: !prev });
      return !prev;
    });
  };

  const toggleRoundUp = () => {
    setRoundUpEnabled((prev) => {
      saveData({ roundUpEnabled: !prev });
      return !prev;
    });
  };

  const buyHolding = (holdingId: string, amount: number): boolean => {
    const cash = balance - investedBalance;
    if (amount <= 0 || amount > cash) return false;
    const holding = holdings.find((h) => h.id === holdingId);
    if (!holding) return false;
    setInvestedBalance((prev) => prev + amount);
    setHoldings((prev) => {
      const totalInvested = prev.reduce((s, h) => s + h.balance, 0) + amount;
      return prev.map((h) => {
        const newBalance = h.id === holdingId ? h.balance + amount : h.balance;
        return { ...h, balance: newBalance, allocation: Math.round((newBalance / totalInvested) * 100) };
      });
    });
    const today = new Date().toISOString().split("T")[0];
    const txId = "t" + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setTransactions((prev) => [
      { id: txId, type: "investment", amount: -amount, description: `Buy ${holding.ticker}`, date: today, category: "investment" },
      ...prev,
    ]);
    return true;
  };

  const HOLDING_COLORS_NEW = ["#2E5E3F", "#4A8BA8", "#D4A574", "#8B6B9C", "#C45B4A"];

  const buyNewTicker = (ticker: string, name: string, amount: number): boolean => {
    const cash = balance - investedBalance;
    if (amount <= 0 || amount > cash) return false;
    const existing = holdings.find((h) => h.ticker === ticker);
    if (existing) return buyHolding(existing.id, amount);
    const newId = "custom-" + Date.now();
    const color = HOLDING_COLORS_NEW[holdings.length % HOLDING_COLORS_NEW.length];
    const newHolding: InvestmentHolding = {
      id: newId,
      name,
      ticker,
      allocation: 0,
      balance: amount,
      returnPercent: 8 + Math.random() * 12,
      color,
    };
    setInvestedBalance((prev) => prev + amount);
    setHoldings((prev) => {
      const totalInvested = prev.reduce((s, h) => s + h.balance, 0) + amount;
      return [...prev.map((h) => ({ ...h, allocation: Math.round((h.balance / totalInvested) * 100) })), { ...newHolding, allocation: Math.round((amount / totalInvested) * 100) }];
    });
    const today = new Date().toISOString().split("T")[0];
    const txId = "t" + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setTransactions((prev) => [
      { id: txId, type: "investment", amount: -amount, description: `Buy ${ticker}`, date: today, category: "investment" },
      ...prev,
    ]);
    return true;
  };

  const sellHolding = (holdingId: string, amount: number): boolean => {
    const holding = holdings.find((h) => h.id === holdingId);
    if (!holding || amount <= 0 || amount > holding.balance) return false;
    setInvestedBalance((prev) => prev - amount);
    setHoldings((prev) => {
      const totalInvested = prev.reduce((s, h) => s + h.balance, 0) - amount;
      if (totalInvested <= 0) {
        return prev.map((h) => (h.id === holdingId ? { ...h, balance: 0, allocation: 0 } : h));
      }
      return prev.map((h) => {
        const newBalance = h.id === holdingId ? h.balance - amount : h.balance;
        return { ...h, balance: newBalance, allocation: Math.round((newBalance / totalInvested) * 100) };
      });
    });
    const today = new Date().toISOString().split("T")[0];
    const txId = "t" + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setTransactions((prev) => [
      { id: txId, type: "investment", amount, description: `Sell ${holding.ticker}`, date: today, category: "investment" },
      ...prev,
    ]);
    return true;
  };

  const buyProportional = (amount: number): boolean => {
    const cash = balance - investedBalance;
    if (amount <= 0 || amount > cash) return false;
    setInvestedBalance((prev) => prev + amount);
    setHoldings((prev) => {
      const totalInvested = prev.reduce((s, h) => s + h.balance, 0) + amount;
      return prev.map((h) => {
        const addAmount = amount * (h.allocation / 100);
        const newBalance = h.balance + addAmount;
        return { ...h, balance: newBalance, allocation: Math.round((newBalance / totalInvested) * 100) };
      });
    });
    const today = new Date().toISOString().split("T")[0];
    const txId = "t" + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setTransactions((prev) => [
      { id: txId, type: "investment", amount: -amount, description: "Buy (proportional)", date: today, category: "investment" },
      ...prev,
    ]);
    return true;
  };

  const sellProportional = (amount: number): boolean => {
    const totalInvested = holdings.reduce((s, h) => s + h.balance, 0);
    if (amount <= 0 || amount > totalInvested) return false;
    setInvestedBalance((prev) => prev - amount);
    setHoldings((prev) => {
      const newTotal = totalInvested - amount;
      if (newTotal <= 0) {
        return prev.map((h) => ({ ...h, balance: 0 }));
      }
      return prev.map((h) => {
        const sellAmount = amount * (h.allocation / 100);
        const newBalance = Math.max(0, h.balance - sellAmount);
        return { ...h, balance: newBalance, allocation: Math.round((newBalance / newTotal) * 100) };
      });
    });
    const today = new Date().toISOString().split("T")[0];
    const txId = "t" + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setTransactions((prev) => [
      { id: txId, type: "investment", amount, description: "Sell (proportional)", date: today, category: "investment" },
      ...prev,
    ]);
    return true;
  };

  const updatePortfolioMix = (newAllocations: { id: string; allocation: number }[]) => {
    const totalInvested = holdings.reduce((s, h) => s + h.balance, 0);
    if (totalInvested <= 0) return;
    setHoldings((prev) =>
      prev.map((h) => {
        const newAlloc = newAllocations.find((a) => a.id === h.id);
        if (!newAlloc) return h;
        const newBalance = Math.round(totalInvested * (newAlloc.allocation / 100) * 100) / 100;
        return { ...h, allocation: newAlloc.allocation, balance: newBalance };
      })
    );
  };

  const applyPortfolioPreset = (index: number) => {
    if (index < 0 || index >= PORTFOLIO_PRESETS.length) return;
    const preset = PORTFOLIO_PRESETS[index];
    const totalInvested = holdings.reduce((s, h) => s + h.balance, 0);
    const hasStandardHoldings = holdings.some((h) => h.id === "1" || h.id === "2" || h.id === "3");
    if (hasStandardHoldings) {
      updatePortfolioMix([
        { id: "1", allocation: preset.stocks },
        { id: "2", allocation: preset.bonds },
        { id: "3", allocation: preset.cash },
      ]);
    } else if (totalInvested > 0) {
      setHoldings([
        { id: "1", name: "Stocks", ticker: "Stocks", allocation: preset.stocks, balance: Math.round(totalInvested * (preset.stocks / 100) * 100) / 100, returnPercent: 12.8, color: "#2E5E3F" },
        { id: "2", name: "Bonds", ticker: "Bonds", allocation: preset.bonds, balance: Math.round(totalInvested * (preset.bonds / 100) * 100) / 100, returnPercent: 3.8, color: "#4A8BA8" },
        { id: "3", name: "Cash", ticker: "Cash", allocation: preset.cash, balance: Math.round(totalInvested * (preset.cash / 100) * 100) / 100, returnPercent: 0.5, color: "#D4A574" },
      ]);
    }
    setPortfolioIndex(index);
    saveData({ portfolioIndex: index });
  };

  const HOLDING_COLORS = ["#2E5E3F", "#4A8BA8", "#D4A574", "#8B6B9C", "#C45B4A"];

  const completeOnboarding = (name?: string, newPortfolioIndex?: number, customTickers?: { ticker: string; name: string; allocation: number }[]) => {
    setHasCompletedOnboarding(true);
    if (name) setUserName(name);
    const idx = newPortfolioIndex ?? portfolioIndex;
    const totalInvested = holdings.reduce((s, h) => s + h.balance, 0) || 8550;

    if (customTickers && customTickers.length > 0 && customTickers.reduce((s, t) => s + t.allocation, 0) === 100) {
      const newHoldings: InvestmentHolding[] = customTickers.map((t, i) => ({
        id: `custom-${i}`,
        name: t.name,
        ticker: t.ticker,
        allocation: t.allocation,
        balance: Math.round(totalInvested * (t.allocation / 100) * 100) / 100,
        returnPercent: 8 + Math.random() * 12,
        color: HOLDING_COLORS[i % HOLDING_COLORS.length],
      }));
      setHoldings(newHoldings);
      setPortfolioIndex(2);
    } else if (typeof newPortfolioIndex === "number" && newPortfolioIndex >= 0 && newPortfolioIndex <= 4) {
      setPortfolioIndex(newPortfolioIndex);
      const preset = PORTFOLIO_PRESETS[newPortfolioIndex];
      if (totalInvested > 0) {
        setHoldings((prev) =>
          prev.map((h) => {
            const alloc = h.id === "1" ? preset.stocks : h.id === "2" ? preset.bonds : preset.cash;
            const newBalance = Math.round(totalInvested * (alloc / 100) * 100) / 100;
            return { ...h, allocation: alloc, balance: newBalance };
          })
        );
      }
    }

    saveData({
      hasCompletedOnboarding: true,
      ...(name ? { userName: name } : {}),
      portfolioIndex: typeof newPortfolioIndex === "number" ? newPortfolioIndex : idx,
    });
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear storage:", e);
    }
    setHasCompletedOnboarding(false);
    setUserName("");
    setBalance(12550);
    setInvestedBalance(8550);
    setContributionYTD(2000);
    setTransactions(defaultTransactions);
    setReceipts(defaultReceipts);
    setHoldings(defaultHoldings);
    setPortfolioIndex(2);
    setAutoInvestEnabled(true);
    setFirstDollarEnabled(true);
    setRoundUpEnabled(false);
    setLinkedCards([{ id: "lc1", type: "visa", last4: "4829", label: "Chase Sapphire", isDefault: true }]);
    setLinkedBankAccounts([{ id: "ba1", bankName: "Chase", accountType: "checking", last4: "7842", isPrimary: true }]);
  };

  const cashBalance = balance - investedBalance;

  const totalUnreimbursed = useMemo(() => {
    return receipts
      .filter((r) => r.status === "unreimbursed")
      .reduce((sum, r) => sum + r.amount, 0);
  }, [receipts]);

  const loyaltyPoints = useMemo(() => {
    const loyalty = getLoyaltyTier(balance);
    const multiplier = loyalty.current?.pointsMultiplier ?? 1;
    const purchaseTxs = transactions.filter((t) => t.type === "purchase");
    const purchaseTotal = purchaseTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const purchasePoints = Math.round(purchaseTotal * 2);
    let taskPoints = 0;
    if (contributionYTD >= contributionLimit) taskPoints += 100;
    taskPoints += 150;
    const historicalPoints = 14013;
    return Math.round((purchasePoints + taskPoints + historicalPoints) * multiplier);
  }, [balance, contributionYTD, contributionLimit, transactions]);

  const value = useMemo(
    () => ({
      balance,
      investedBalance,
      cashBalance,
      contributionYTD,
      contributionLimit,
      transactions,
      receipts,
      holdings,
      autoInvestEnabled,
      firstDollarEnabled,
      roundUpEnabled,
      loyaltyPoints,
      hasCompletedOnboarding,
      isLoading,
      userName,
      portfolioIndex,
      totalUnreimbursed,
      linkedCards,
      linkedBankAccounts,
      addLinkedCard,
      removeLinkedCard,
      setDefaultCard,
      addLinkedBankAccount,
      removeLinkedBankAccount,
      setPrimaryBankAccount,
      addContribution,
      addReceipt,
      autoReimburse,
      toggleAutoInvest,
      toggleFirstDollar,
      toggleRoundUp,
      completeOnboarding,
      buyHolding,
      buyNewTicker,
      sellHolding,
      buyProportional,
      sellProportional,
      updatePortfolioMix,
      applyPortfolioPreset,
      logout,
    }),
    [balance, investedBalance, cashBalance, contributionYTD, contributionLimit, transactions, receipts, holdings, autoInvestEnabled, firstDollarEnabled, roundUpEnabled, loyaltyPoints, hasCompletedOnboarding, isLoading, userName, portfolioIndex, totalUnreimbursed, linkedCards, linkedBankAccounts]
  );

  return <HSAContext.Provider value={value}>{children}</HSAContext.Provider>;
}

export function useHSA() {
  const context = useContext(HSAContext);
  if (!context) {
    throw new Error("useHSA must be used within HSAProvider");
  }
  return context;
}
