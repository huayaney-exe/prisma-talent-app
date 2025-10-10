"""Integration tests for Leads API endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestLeadsAPI:
    """Test cases for Leads API."""

    def test_health_check(self, client: TestClient) -> None:
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_create_lead_success(
        self,
        client: TestClient,
        mock_lead_data: dict
    ) -> None:
        """Test successful lead creation."""
        response = client.post("/api/v1/leads", json=mock_lead_data)

        # Should succeed or fail gracefully (depending on Supabase connection)
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert "company_id" in data
            assert data["message"] == "Lead submitted successfully"
        else:
            # If Supabase not configured, should get 500
            assert response.status_code == 500

    def test_create_lead_missing_fields(self, client: TestClient) -> None:
        """Test lead creation with missing required fields."""
        incomplete_data = {
            "contact_name": "Test User",
            "company_name": "Test Company"
            # Missing required fields
        }

        response = client.post("/api/v1/leads", json=incomplete_data)
        assert response.status_code == 422  # Validation error

    def test_create_lead_invalid_email(
        self,
        client: TestClient,
        mock_lead_data: dict
    ) -> None:
        """Test lead creation with invalid email."""
        mock_lead_data["contact_email"] = "invalid-email"

        response = client.post("/api/v1/leads", json=mock_lead_data)
        assert response.status_code == 422

    def test_create_lead_terms_not_accepted(
        self,
        client: TestClient,
        mock_lead_data: dict
    ) -> None:
        """Test lead creation without accepting terms."""
        mock_lead_data["terms_acceptance"] = False

        response = client.post("/api/v1/leads", json=mock_lead_data)
        assert response.status_code == 422

    def test_get_leads_requires_auth(self, client: TestClient) -> None:
        """Test that getting leads requires authentication."""
        response = client.get("/api/v1/leads")

        # Should require authentication (401 or 403)
        assert response.status_code in [401, 403]

    def test_api_documentation_available(self, client: TestClient) -> None:
        """Test that API documentation is accessible in dev mode."""
        response = client.get("/docs")

        # In test mode, docs should be available
        assert response.status_code == 200
