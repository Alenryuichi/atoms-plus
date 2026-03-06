# Tests for atoms_plus.team_mode.api
"""Unit tests for Team Mode API endpoints."""

import pytest
from fastapi.testclient import TestClient

from atoms_plus.team_mode.api import router, sessions


@pytest.fixture
def client():
    """Create a test client for the API."""
    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_sessions():
    """Clear sessions before each test."""
    sessions.clear()
    yield
    sessions.clear()


class TestTeamModeInfo:
    """Tests for /api/v1/team/ endpoint."""

    def test_returns_team_mode_info(self, client):
        """Should return Team Mode information."""
        response = client.get('/api/v1/team/')

        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Team Mode'
        assert data['version'] == '0.1.0'
        assert 'pm' in data['mvp_agents']
        assert 'architect' in data['mvp_agents']
        assert 'engineer' in data['mvp_agents']


class TestCreateSession:
    """Tests for POST /api/v1/team/sessions endpoint."""

    def test_creates_session(self, client):
        """Should create a new session."""
        response = client.post(
            '/api/v1/team/sessions',
            json={'task': 'Build a REST API'},
        )

        assert response.status_code == 200
        data = response.json()
        assert 'session_id' in data
        assert data['status'] == 'created'
        assert 'created_at' in data

    def test_creates_session_with_custom_model(self, client):
        """Should accept custom model parameter."""
        response = client.post(
            '/api/v1/team/sessions',
            json={
                'task': 'Test task',
                'model': 'gpt-4o',
                'max_iterations': 5,
            },
        )

        assert response.status_code == 200
        session_id = response.json()['session_id']
        assert sessions[session_id]['state']['model'] == 'gpt-4o'
        assert sessions[session_id]['state']['max_iterations'] == 5

    def test_validates_max_iterations(self, client):
        """Should reject invalid max_iterations."""
        response = client.post(
            '/api/v1/team/sessions',
            json={
                'task': 'Test',
                'max_iterations': 100,  # > 10
            },
        )

        assert response.status_code == 422  # Validation error


class TestGetSessionStatus:
    """Tests for GET /api/v1/team/sessions/{session_id} endpoint."""

    def test_returns_session_status(self, client):
        """Should return session status."""
        # Create a session first
        create_response = client.post(
            '/api/v1/team/sessions',
            json={'task': 'Test task'},
        )
        session_id = create_response.json()['session_id']

        # Get status
        response = client.get(f'/api/v1/team/sessions/{session_id}')

        assert response.status_code == 200
        data = response.json()
        assert data['session_id'] == session_id
        assert data['status'] == 'created'
        assert data['iteration'] == 0
        assert data['thoughts_count'] == 0

    def test_returns_404_for_unknown_session(self, client):
        """Should return 404 for non-existent session."""
        response = client.get('/api/v1/team/sessions/nonexistent-id')

        assert response.status_code == 404
        assert 'not found' in response.json()['detail'].lower()
