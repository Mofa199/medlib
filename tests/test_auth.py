import json
from backend.app.models import User
from backend.app import db

def test_registration(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/auth/register' page is posted to (POST)
    THEN check that a '201' status code is returned and user is created
    """
    response = test_client.post('/auth/register',
                                data=json.dumps({
                                    'username': 'testuser',
                                    'email': 'test@example.com',
                                    'password': 'password123'
                                }),
                                content_type='application/json')
    assert response.status_code == 201
    assert b"User registered successfully" in response.data

def test_duplicate_username_registration(test_client):
    """
    GIVEN a user already exists
    WHEN the '/auth/register' page is posted to with the same username
    THEN check that a '400' status code is returned
    """
    # Create the first user
    test_client.post('/auth/register',
                     data=json.dumps({
                         'username': 'testuser',
                         'email': 'test@example.com',
                         'password': 'password123'
                     }),
                     content_type='application/json')
    # Attempt to create a duplicate
    response = test_client.post('/auth/register',
                                data=json.dumps({
                                    'username': 'testuser',
                                    'email': 'another@example.com',
                                    'password': 'password123'
                                }),
                                content_type='application/json')
    assert response.status_code == 400
    assert b"Username already exists" in response.data

def test_login(test_client):
    """
    GIVEN a registered user
    WHEN the '/auth/login' page is posted to (POST)
    THEN check that a '200' status code is returned and an access token is provided
    """
    # Create the user first
    user = User(username='loginuser', email='login@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()

    response = test_client.post('/auth/login',
                                data=json.dumps({
                                    'username': 'loginuser',
                                    'password': 'password123'
                                }),
                                content_type='application/json')
    assert response.status_code == 200
    assert b"access_token" in response.data

def test_invalid_login(test_client):
    """
    GIVEN a registered user
    WHEN the '/auth/login' page is posted to with incorrect password
    THEN check that a '401' status code is returned
    """
    # Create the user first
    user = User(username='loginuser', email='login@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()

    response = test_client.post('/auth/login',
                                data=json.dumps({
                                    'username': 'loginuser',
                                    'password': 'wrongpassword'
                                }),
                                content_type='application/json')
    assert response.status_code == 401
    assert b"Invalid username or password" in response.data
