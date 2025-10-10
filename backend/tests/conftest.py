"""Pytest configuration and fixtures."""

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


@pytest.fixture(scope="session")
def test_app() -> FastAPI:
    """Get FastAPI app instance for testing."""
    return app


@pytest.fixture(scope="function")
def client(test_app: FastAPI) -> Generator[TestClient, None, None]:
    """Get test client for API requests."""
    with TestClient(test_app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def test_settings() -> settings:
    """Get application settings for tests."""
    return settings


@pytest.fixture
def mock_lead_data() -> dict:
    """Mock lead form data for testing."""
    return {
        "contact_name": "Test User",
        "position": "Test Position",
        "company_name": "Test Company",
        "contact_email": "test@example.com",
        "contact_phone": "+51999999999",
        "intent": "hiring",
        "role_title": "Senior Product Manager",
        "role_type": "Product Manager",
        "level": "Senior (5-8 años)",
        "work_mode": "Híbrido",
        "urgency": "Standard",
        "terms_acceptance": True
    }


@pytest.fixture
def mock_enrollment_data() -> dict:
    """Mock enrollment data for testing."""
    return {
        "company_name": "Test Startup",
        "company_domain": "teststartup.com",
        "industry": "Technology",
        "company_size": "11-50",
        "website_url": "https://teststartup.com",
        "hr_email": "hr@teststartup.com",
        "hr_full_name": "Test HR Manager",
        "hr_position": "HR Manager",
        "hr_phone": "+51988888888",
        "subscription_plan": "basic"
    }
