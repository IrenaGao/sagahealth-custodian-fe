# Saga Health

## Overview
A modern HSA (Health Savings Account) custodian app with Acorns-like auto-invest features built into onboarding and first dollar investing. Features automatic contribution limit tracking, receipt/reimbursement management, and an integrated health & wellness marketplace with nearby services map.

## Architecture
- **Frontend**: Expo React Native with file-based routing (Expo Router)
- **Backend**: Express.js (port 5000) serving APIs and landing page
- **State Management**: React Context (HSAContext) + AsyncStorage for persistence
- **Styling**: React Native StyleSheet with DM Sans custom font
- **Design**: Forest green theme (#2E5E3F) with sage green background (#D5E5D0), warm accents

## Project Structure
- `app/(tabs)/` - Four tab screens: Home, Marketplace, Investments, Accounts
- `app/onboarding.tsx` - Multi-step onboarding flow
- `app/nearby-services.tsx` - Map screen for nearby health/wellness services
- `components/MapWrapper.web.tsx` / `MapWrapper.native.tsx` - Platform-specific map components
- `contexts/HSAContext.tsx` - Global state for HSA data
- `constants/colors.ts` - Theme color palette
- `server/` - Express backend

## Key Features
- Home dashboard with balance, Saga logo, contribution tracking, recent activity
- Health & wellness marketplace with Products, Apps, and Services categories
- Nearby services map with react-native-maps (native) and web fallback
- Investment portfolio with auto-invest, first dollar investing, round-up settings, pie chart allocation
- Account management with receipt tracking, reimbursement submission
- Comprehensive 13-step onboarding: personal info, disclosures & consent, approval, bank connection (Plaid-style), contribution setup, funds pending/available, 5-question risk profile, portfolio recommendation slider, auto-invest setup

## User Preferences
- Company name: Saga Health
- Modern fintech aesthetic inspired by Acorns
- DM Sans font family
- Forest green primary color (#2E5E3F) with sage green background (#D5E5D0)
- Logo: Sail/ship icon with "SAGA" text
