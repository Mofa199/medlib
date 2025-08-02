import json
from backend.app import db
from backend.app.models import User, Course

def get_auth_headers(test_client, username='adminuser', password='adminpassword', role='admin'):
    """Helper function to register a user, log them in, and return auth headers."""
    user = User(username=username, email=f'{username}@example.com', role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    response = test_client.post('/auth/login',
                                data=json.dumps({'username': username, 'password': password}),
                                content_type='application/json')
    token = json.loads(response.data)['access_token']
    return {'Authorization': f'Bearer {token}'}

def test_admin_course_creation(test_client):
    """
    GIVEN an admin user
    WHEN the '/admin/courses' endpoint is posted to
    THEN check that a course is created successfully
    """
    headers = get_auth_headers(test_client, role='admin')
    response = test_client.post('/admin/courses',
                                 headers=headers,
                                 data=json.dumps({
                                     'name': 'Test Course',
                                     'description': 'A course for testing.'
                                 }),
                                 content_type='application/json')
    assert response.status_code == 201
    assert b"Course created successfully" in response.data

def test_non_admin_access_to_admin_route(test_client):
    """
    GIVEN a non-admin user
    WHEN trying to access an admin route
    THEN check for a 403 Forbidden error
    """
    headers = get_auth_headers(test_client, username='regularuser', password='password123', role='student')

    response = test_client.post('/admin/courses',
                                 headers=headers,
                                 data=json.dumps({'name': 'Unauthorized Course'}),
                                 content_type='application/json')

    assert response.status_code == 403
    assert b"Admins only!" in response.data

def test_get_courses_as_admin(test_client):
    """
    GIVEN an admin and a course in the DB
    WHEN the '/admin/courses' endpoint is accessed (GET)
    THEN check that the course is returned
    """
    # Setup: create a course
    course = Course(name='Existing Course', description='A pre-existing course.')
    db.session.add(course)
    db.session.commit()

    # Get admin headers
    headers = get_auth_headers(test_client, role='admin')

    response = test_client.get('/admin/courses', headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]['name'] == 'Existing Course'

def test_unauthenticated_access(test_client):
    """
    GIVEN no authentication
    WHEN trying to access an admin route
    THEN check for a 401 Unauthorized error
    """
    response = test_client.get('/admin/courses')
    # This should be 401 because JWT is missing, not 422
    assert response.status_code == 401
    assert b"Missing Authorization Header" in response.data
