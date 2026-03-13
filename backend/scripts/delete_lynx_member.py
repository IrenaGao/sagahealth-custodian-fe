#!/usr/bin/env python3
"""Script to delete a member from the Lynx API."""
import pathlib
import httpx
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=pathlib.Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        env_prefix="SAGA_",
        extra="ignore"
    )
    LYNX_API_BASE_URL: str = "https://sandbox.lynx-fh.co"
    LYNX_AUTH_TOKEN: str
    LYNX_CLIENT_ORG_NAME: str = "Saga_Sandbox"


def main():
    settings = Settings()  # type: ignore[call-arg]

    client_id = input("clientMemberId: ").strip()
    client_org_name = input(f"clientOrgName [{settings.LYNX_CLIENT_ORG_NAME}]: ").strip()

    if not client_id:
        print("Error: clientMemberId is required.")
        return

    if not client_org_name:
        client_org_name = settings.LYNX_CLIENT_ORG_NAME

    url = f"{settings.LYNX_API_BASE_URL}/members/status"
    params = {"clientMemberId": client_id, "clientOrgName": client_org_name}
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {settings.LYNX_AUTH_TOKEN}",
    }

    print(f"\nSending DELETE {url}")
    print(f"Params: {params}\n")

    response = httpx.delete(url, params=params, headers=headers)
    print(f"Status: {response.status_code}")
    if response.text:
        print(f"Response: {response.text}")


if __name__ == "__main__":
    main()
