import pytest
from backend.app import create_app, db
from backend.config import TestingConfig

@pytest.fixture(scope='function')
def test_client():
    """
    Creates a test client for the Flask application for each test function.
    This ensures that each test runs in a clean environment.
    """
    # Create a Flask application configured for testing
    app = create_app(config_class=TestingConfig)

    # Establish an application context
    with app.app_context():
        # Create the database and the database table(s)
        db.create_all()

        # Create a test client using the Flask application configured for testing
        with app.test_client() as testing_client:
            # Yield the client to the tests
            yield testing_client

        # Tear down the database
        db.session.remove()
        db.drop_all()
