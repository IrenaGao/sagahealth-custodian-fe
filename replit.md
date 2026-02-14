# Bloom HSA

## Overview
A modern HSA (Health Savings Account) custodian app with Acorns-like auto-invest features built into onboarding and first dollar investing. Features automatic contribution limit tracking, receipt/reimbursement management, and an integrated health & wellness marketplace.

## Architecture
- **Frontend**: Expo React Native with file-based routing (Expo Router)
- **Backend**: Express.js (port 5000) serving APIs and landing page
- **State Management**: React Context (HSAContext) + AsyncStorage for persistence
- **Styling**: React Native StyleSheet with DM Sans custom font
- **Design**: Emerald/teal financial theme with navy accents

## Project Structure
- `app/(tabs)/` - Four tab screens: Home, Marketplace, Investments, Accounts
- `app/onboarding.tsx` - Multi-step onboarding flow
- `contexts/HSAContext.tsx` - Global state for HSA data
- `constants/colors.ts` - Theme color palette
- `server/` - Express backend

## Key Features
- Home dashboard with balance, contribution tracking, recent activity
- Health & wellness marketplace with categories and HSA eligibility badges
- Investment portfolio with auto-invest, first dollar investing, round-up settings
- Account management with receipt tracking, reimbursement submission
- Onboarding flow with risk tolerance, contribution schedule, smart features

## User Preferences
- Modern fintech aesthetic inspired by Acorns
- DM Sans font family
- Emerald green primary color
