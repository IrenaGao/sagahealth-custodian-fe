import Constants from "expo-constants"

export const _API_PORT: string = "8000";

// hostUri is e.g. "192.168.1.5:8081" in LAN mode or a tunnel hostname in tunnel mode.
// For tunnel mode the hostname is external and won't have the FastAPI backend, so we
// only use it when it looks like a local IP; otherwise fall back to localhost.
const rawHost: string = Constants.expoConfig?.hostUri || "";
const hostOnly: string = rawHost.includes(":") ? rawHost.split(":")[0] : rawHost;
const isLocal = hostOnly === "localhost" || hostOnly === "127.0.0.1" || /^192\.168\./.test(hostOnly) || /^10\./.test(hostOnly);

export const _API_HOST: string = isLocal ? hostOnly : "localhost";

export const API_BASE_URL: string = `http://${_API_HOST}:${_API_PORT}`;

// Hardcoded values for Lynx API enrollment (matching Postman sandbox config)
export const HARDCODED_MEMBER_CARD_PLAN_NAME = "Saga Sandbox MHH1";
export const HARDCODED_MEMBER_CARD_PACKAGE_NAME = "Test Package4";
export const HARDCODED_MEMBER_PRODUCT_NAME = "HSA_01"
export const HARDCODED_PHONE_COUNTRY_CODE = "1";
export const HARDCODED_ADDRESS_COUNTRY = "US";
export const HARDCODED_CLIENT_ORG = {
  "name": "Saga_Sandbox"
}
export const HARDCODED_HSA_CUSTODIAL_AGREEMENT = {
    "name": "HSA_CUSTODIAL_AGREEMENT",
    "productName": "HSA_01"
}
export const ALL_AGREEMENTS = [
    HARDCODED_HSA_CUSTODIAL_AGREEMENT,
    {
        "name": "DEPOSIT_ACCOUNT_AGREEMENT",
        "productName": "HSA_01"
    },
    {
        "name": "TRUTH_IN_SAVINGS",
        "productName": "HSA_01"
    },
    {
        "name": "FUNDS_AVAILABILITY_AGREEMENT",
        "productName": "HSA_01"
    },
    {
        "name": "EXTERNAL_FUNDS_TRANSFER",
        "productName": "HSA_01"
    },
    {
        "name": "ELECTRONIC_RECORDS_SIGNATURE",
        "productName": "HSA_01"
    },
    
]

