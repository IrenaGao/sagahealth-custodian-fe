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
  status: "pending" | "submitted" | "approved" | "denied";
  provider?: string;
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
  hasCompletedOnboarding: boolean;
  addContribution: (amount: number) => void;
  addReceipt: (receipt: Omit<Receipt, "id">) => void;
  submitReimbursement: (receiptId: string) => void;
  toggleAutoInvest: () => void;
  toggleFirstDollar: () => void;
  toggleRoundUp: () => void;
  completeOnboarding: () => void;
}

const HSAContext = createContext<HSAContextValue | null>(null);

const STORAGE_KEY = "bloom_hsa_data";

const defaultHoldings: InvestmentHolding[] = [
  { id: "1", name: "Stocks", ticker: "Stocks", allocation: 60, balance: 5130, returnPercent: 12.8, color: "#0D9373" },
  { id: "2", name: "Bonds", ticker: "Bonds", allocation: 25, balance: 2137.5, returnPercent: 3.8, color: "#0EA5E9" },
  { id: "3", name: "Cash", ticker: "Cash", allocation: 15, balance: 1282.5, returnPercent: 0.5, color: "#F97316" },
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
  { id: "r1", title: "Annual Physical", amount: 150, date: "2026-02-10", category: "medical", status: "pending", provider: "Dr. Johnson" },
  { id: "r2", title: "Prescription - Amoxicillin", amount: 25, date: "2026-02-05", category: "pharmacy", status: "approved", provider: "CVS Pharmacy" },
  { id: "r3", title: "Eye Exam", amount: 89, date: "2026-01-20", category: "vision", status: "submitted", provider: "Zenni Optical" },
];

export function HSAProvider({ children }: { children: ReactNode }) {
  const [balance] = useState(12550);
  const [investedBalance] = useState(8550);
  const [contributionYTD, setContributionYTD] = useState(2000);
  const [contributionLimit] = useState(4300);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [receipts, setReceipts] = useState<Receipt[]>(defaultReceipts);
  const [holdings] = useState<InvestmentHolding[]>(defaultHoldings);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(true);
  const [firstDollarEnabled, setFirstDollarEnabled] = useState(true);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.hasCompletedOnboarding !== undefined) setHasCompletedOnboarding(data.hasCompletedOnboarding);
        if (data.autoInvestEnabled !== undefined) setAutoInvestEnabled(data.autoInvestEnabled);
        if (data.firstDollarEnabled !== undefined) setFirstDollarEnabled(data.firstDollarEnabled);
        if (data.roundUpEnabled !== undefined) setRoundUpEnabled(data.roundUpEnabled);
      }
    } catch {}
  };

  const saveData = async (updates: Record<string, unknown>) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {}
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
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setReceipts((prev) => [newReceipt, ...prev]);
  };

  const submitReimbursement = (receiptId: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? { ...r, status: "submitted" as const } : r))
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

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    saveData({ hasCompletedOnboarding: true });
  };

  const cashBalance = balance - investedBalance;

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
      hasCompletedOnboarding,
      addContribution,
      addReceipt,
      submitReimbursement,
      toggleAutoInvest,
      toggleFirstDollar,
      toggleRoundUp,
      completeOnboarding,
    }),
    [balance, investedBalance, cashBalance, contributionYTD, contributionLimit, transactions, receipts, holdings, autoInvestEnabled, firstDollarEnabled, roundUpEnabled, hasCompletedOnboarding]
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
