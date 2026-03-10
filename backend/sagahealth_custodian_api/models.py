from pydantic import BaseModel, model_validator, Field, field_validator
# from typing import Any
from enum import Enum

class Idempotency(BaseModel):
    idempotencyKey: str | None = None

class ClientOrg(BaseModel):
    name: str | None = None
    # id: str | None = None

class Address(BaseModel):
    # typeDescription: str | None = None
    name: str | None = None
    # attentionCareOf: str | None = None
    # line3: str | None = None
    # line4: str | None = None
    # pobox: str | None = None
    # county: str | None = None
    line1: str | None = None
    # line2: str | None = None
    city: str | None = None
    stateProvince: str | None = None
    country: str | None = None
    postalCode: str | None = None
    # postalCodeExtension: str | None = None
    primaryIndicator: bool | None = None

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"
    NONDISCLOSED = "Non-Disclosed"
    NONBINARY = "Non-binary"

class CoverageType(str, Enum):
    INDIVIDUAL = "Individual"
    FAMILY = "Family"

class GenderPronoun(str, Enum):
    HE_HIM = "He/Him"
    SHE_HER = "She/Her"
    THEY_THEM = "They/Them"

GENDER_PRONOUN_MAP = {
    Gender.MALE: GenderPronoun.HE_HIM,
    Gender.FEMALE: GenderPronoun.SHE_HER,
    Gender.NONBINARY: GenderPronoun.THEY_THEM,
    Gender.NONDISCLOSED: GenderPronoun.THEY_THEM
}

# yikes
def assume_pronoun(gender: Gender) -> GenderPronoun:
    return GENDER_PRONOUN_MAP.get(gender, GenderPronoun.THEY_THEM)


class Race(str, Enum):
    AMERICAN_INDIAN_OR_ALASKA_NATIVE = "American Indian or Alaska Native"
    ASIAN = "Asian"
    # BLACK_OR_AFRICAN_AMERICAN = "Black or African American"  # Surprised this is not an official race in Lynx API
    # HISPANIC_OR_LATINO = "Hispanic or Latino"  # this as well
    NATIVE_HAWAIIAN_OR_PACIFIC_ISLANDER = "Native Hawaiian or Other Pacific Islander"
    WHITE = "White"
    OTHER = "Other Race"

class Religion(str, Enum):
    CHRISTIANITY = "Christianity"
    ISLAM = "Islam"
    HINDUISM = "Hinduism"
    JUDAISM = "Judaism"
    BUDDHISM = "Buddhism"
    FOLK_RELIGIONS = "Folk Religions"
    OTHER = "Other Religions"
    UNAFFILIATED = "Unaffiliated"
    NONDISCLOSED = "Non-Disclosed"

class MaritalStatus(str, Enum):
    NEVER_MARRIED = "Never Married"
    DIVORCED = "Divorced"
    MARRIED = "Married"
    WIDOWED = "Widowed"
    ANNULLED = "Annulled"
    INTERLOCUTORY = "Interlocutory"
    LEGALLY_SEPARATED = "Legally Separated"
    POLYGAMOUS = "Polygamous"
    DOMESTIC_PARTNER = "Domestic Partner"
    UNKNOWN = "Unknown"

class SupportedLanguage(str, Enum):
    ENGLISH = "en_US"
    CHINESE = "zh_CN"
    PORTUGUESE = "pt_BR"
    SPANISH = "es_ES"
    RUSSIAN = "ru_RU"

class Email(BaseModel):
    # typeDescription: str | None = None
    emailAddress: str | None = None
    primaryIndicator: bool | None = None

class Phone(BaseModel):
    countryCode: str | None = None
    phoneNumber: str | None = None
    # phoneExtension: str | None = None
    # typeDescription: str | None = None
    primaryIndicator: bool | None = None

class MemberCardPreferences(BaseModel):
    planName: str | None = None
    cardPackageName: str | None = None
    rushDelivery: bool | None = None

class Product(BaseModel):
    name: str | None = None

class MemberAccount(BaseModel):
    type: str | None = None
    incentiveRatio: float | None = None
    electionAmount: float | None = None
    numPayPeriod: int | None = None

class MemberProduct(BaseModel):
    effectiveDate: str | None = None
    product: Product | None = None
    memberAccounts: list[MemberAccount] | None = None

class MemberPlanBenefitPackage(BaseModel):
    name: str | None = None
    effectiveDate: str | None = None
    expirationDate: str | None = None
    voidIndicator: bool | None = None
    ssbciIndicator: bool | None = None
    ssbciEffectiveDate: str | None = None

class ConsentName(str, Enum):
    HSA_CUSTODIAL_AGREEMENT = "HSA_CUSTODIAL_AGREEMENT"
    DEPOSIT_ACCOUNT_AGREEMENT = "DEPOSIT_ACCOUNT_AGREEMENT"
    TRUTH_IN_SAVINGS = "TRUTH_IN_SAVINGS"
    FUNDS_AVAILABILITY_AGREEMENT = "FUNDS_AVAILABILITY_AGREEMENT"
    EXTERNAL_FUNDS_TRANSFER = "EXTERNAL_FUNDS_TRANSFER"
    ELECTRONIC_RECORDS_SIGNATURE = "ELECTRONIC_RECORDS_SIGNATURE"

class Consent(BaseModel):
    name: ConsentName | None = None
    productName: str | None = None

class MemberConsent(BaseModel):
    consent: Consent | None = None
    acceptedIndicator: bool | None = None
    electronicSignature: str | None = None
    consentDate: str | None = None

class Tag(BaseModel):
    name: str
    value: str
    type: str | None = None

class Member(BaseModel):
    clientMemberId: str
    clientOrg: ClientOrg
    dateOfBirth: str
    # gender: Gender | None = None
    healthPlanCoverageType: CoverageType
    firstName: str
    lastName: str
    middleName: str | None = None
    # namePrefix: str | None = None
    # nameSuffix: str | None = None
    # preferredGenderPronoun: GenderPronoun | None = None
    # race: Race | None = None
    # religion: Religion | None = None
    # maritalStatus: MaritalStatus | None = None
    # usTaxpayerIndicator: bool | None = None
    # countryOfCitizenship: str | None = None
    # ssn: str | None = None
    ssn: str
    # passport: str | None = None
    language: SupportedLanguage = SupportedLanguage.ENGLISH
    addresses: list[Address] | None = None
    emails: list[Email] | None = None
    phones: list[Phone] | None = None
    memberCardPreferences: MemberCardPreferences | None = None
    memberProducts: list[MemberProduct] | None = None
    # memberPlanBenefitPackage: MemberPlanBenefitPackage | None = None
    memberConsents: list[MemberConsent] | None = None
    tags: list[Tag] | None = None

    # @model_validator(mode="after")
    # def validate_identification(self):
    #     # if not self.ssn and not self.passport:
    #     if not self.ssn:
    #         # raise ValueError("At least one of SSN or passport must be provided")
    #         raise ValueError("SSN must be provided")
    #     return self
    
    @field_validator("emails", mode="before")
    @classmethod
    def validate_emails(cls, emails):
        # At least one email is required
        if not emails or len(emails) == 0:
            raise ValueError("At least one email is required")
        return emails
    
    @field_validator("phones", mode="before")
    @classmethod
    def validate_phones(cls, phones):
        # At least one phone number is required
        if not phones or len(phones) == 0:
            raise ValueError("At least one phone number is required")
        return phones

class Enrollment(BaseModel):
    member: Member

class EnrollmentPayload(BaseModel):
    # model_config = {"extra": "allow"}

    data: Enrollment
    idempotency: Idempotency
