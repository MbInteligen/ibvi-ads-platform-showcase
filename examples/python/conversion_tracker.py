"""
Conversion Tracker Example

This example demonstrates how the Python Gateway handles conversion uploads
to Google Ads Enhanced Conversions API.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
import httpx
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException


# ============================================================================
# Request/Response Models
# ============================================================================

class GoogleConversionRequest(BaseModel):
    """Request model for Google Ads conversion upload"""
    
    gclid: str = Field(..., description="Google Click ID from ad click")
    conversion_action: str = Field(
        ..., 
        description="Conversion action resource name",
        example="customers/1234567890/conversionActions/987654321"
    )
    conversion_value: float = Field(
        ..., 
        gt=0,
        description="Monetary value of conversion in currency"
    )
    currency_code: str = Field(default="BRL", max_length=3)
    conversion_time: datetime = Field(
        ..., 
        description="When the conversion occurred (ISO 8601)"
    )
    
    # Enhanced conversion data (optional but recommended)
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    @validator('email')
    def normalize_email(cls, v):
        """Normalize email to lowercase for hashing"""
        return v.lower() if v else None
    
    @validator('phone')
    def normalize_phone(cls, v):
        """Remove non-digit characters from phone"""
        return ''.join(filter(str.isdigit, v)) if v else None


class ConversionResponse(BaseModel):
    """Response after successful conversion upload"""
    
    status: str = "success"
    conversion_id: str
    message: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Conversion Upload Service
# ============================================================================

class ConversionService:
    """Service for uploading conversions to Google Ads"""
    
    def __init__(self, google_ads_client: GoogleAdsClient, customer_id: str):
        self.client = google_ads_client
        self.customer_id = customer_id
        self.conversion_upload_service = self.client.get_service(
            "ConversionUploadService"
        )
    
    async def upload_click_conversion(
        self, 
        request: GoogleConversionRequest
    ) -> ConversionResponse:
        """
        Upload a click conversion with optional enhanced conversion data
        
        Args:
            request: Conversion data including gclid and value
            
        Returns:
            ConversionResponse with upload status
            
        Raises:
            HTTPException: If upload fails
        """
        try:
            # Create click conversion
            click_conversion = self.client.get_type("ClickConversion")
            click_conversion.gclid = request.gclid
            click_conversion.conversion_action = request.conversion_action
            click_conversion.conversion_value = request.conversion_value
            click_conversion.currency_code = request.currency_code
            click_conversion.conversion_date_time = request.conversion_time.strftime(
                "%Y-%m-%d %H:%M:%S%z"
            )
            
            # Add enhanced conversion data if provided
            if any([request.email, request.phone, request.first_name]):
                user_data = self._build_enhanced_conversion_data(request)
                if user_data:
                    click_conversion.user_identifiers.append(user_data)
            
            # Upload conversion
            upload_request = self.client.get_type(
                "UploadClickConversionsRequest"
            )
            upload_request.customer_id = self.customer_id
            upload_request.conversions.append(click_conversion)
            upload_request.partial_failure = True
            
            response = self.conversion_upload_service.upload_click_conversions(
                request=upload_request
            )
            
            # Check for partial failures
            if response.partial_failure_error:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Partial failure: {response.partial_failure_error}"
                )
            
            # Extract conversion ID from response
            conversion_id = response.results[0].conversion_action if response.results else "unknown"
            
            return ConversionResponse(
                conversion_id=conversion_id,
                message=f"Conversion uploaded successfully for gclid: {request.gclid}"
            )
            
        except GoogleAdsException as ex:
            error_msg = self._format_google_ads_error(ex)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Google Ads API error: {error_msg}"
            )
    
    def _build_enhanced_conversion_data(
        self, 
        request: GoogleConversionRequest
    ) -> Optional[object]:
        """Build enhanced conversion user identifiers"""
        user_data = self.client.get_type("UserData")
        
        # Add hashed email
        if request.email:
            email_identifier = self.client.get_type("UserIdentifier")
            email_identifier.hashed_email = self._hash_normalize(request.email)
            user_data.user_identifiers.append(email_identifier)
        
        # Add hashed phone
        if request.phone:
            phone_identifier = self.client.get_type("UserIdentifier")
            phone_identifier.hashed_phone_number = self._hash_normalize(
                request.phone
            )
            user_data.user_identifiers.append(phone_identifier)
        
        # Add address info
        if request.first_name or request.last_name:
            address = self.client.get_type("OfflineUserAddressInfo")
            if request.first_name:
                address.hashed_first_name = self._hash_normalize(
                    request.first_name
                )
            if request.last_name:
                address.hashed_last_name = self._hash_normalize(
                    request.last_name
                )
            user_data.user_identifiers.append(address)
        
        return user_data if user_data.user_identifiers else None
    
    @staticmethod
    def _hash_normalize(value: str) -> str:
        """Hash and normalize PII data (SHA-256)"""
        import hashlib
        normalized = value.strip().lower()
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    @staticmethod
    def _format_google_ads_error(ex: GoogleAdsException) -> str:
        """Format Google Ads exception for logging"""
        errors = []
        for error in ex.failure.errors:
            errors.append(
                f"Error: {error.error_code.conversion_upload_error} "
                f"- {error.message}"
            )
        return " | ".join(errors)


# ============================================================================
# FastAPI Router
# ============================================================================

router = APIRouter(prefix="/v1/conversions", tags=["conversions"])

@router.post(
    "/google",
    response_model=ConversionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Google Ads Conversion",
    description="""
    Upload a conversion to Google Ads Enhanced Conversions API.
    
    Supports:
    - Click conversions (gclid-based)
    - Enhanced conversions (with PII hashing)
    - Conversion value and currency
    - Custom conversion time
    
    Example:
    ```json
    {
        "gclid": "Cj0KCQjw...",
        "conversion_action": "customers/1234567890/conversionActions/987654321",
        "conversion_value": 1500.00,
        "currency_code": "BRL",
        "conversion_time": "2025-11-17T15:30:00Z",
        "email": "customer@example.com",
        "phone": "+5511999999999"
    }
    ```
    """
)
async def upload_google_conversion(
    request: GoogleConversionRequest,
    # Dependencies injected here (client, auth, etc.)
) -> ConversionResponse:
    """Upload a conversion to Google Ads"""
    
    # Initialize service (normally injected via dependency)
    service = ConversionService(
        google_ads_client=get_google_ads_client(),  # From dependency
        customer_id="1234567890"  # From config
    )
    
    return await service.upload_click_conversion(request)


# ============================================================================
# Example Usage
# ============================================================================

async def example_usage():
    """Example of how to use the conversion tracker"""
    
    # Simulate a conversion from website
    conversion_data = GoogleConversionRequest(
        gclid="Cj0KCQjwxb2XBhDBARIsAOjDZ37...",
        conversion_action="customers/1234567890/conversionActions/987654321",
        conversion_value=2500.00,
        currency_code="BRL",
        conversion_time=datetime.utcnow(),
        email="customer@example.com",
        phone="11999999999",
        first_name="João",
        last_name="Silva"
    )
    
    # Upload via API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://gateway:8000/v1/conversions/google",
            json=conversion_data.dict(),
            headers={"Authorization": "Bearer <token>"}
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Conversion uploaded: {result['conversion_id']}")
        else:
            print(f"❌ Failed: {response.text}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage())
