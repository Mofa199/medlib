from backend.app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='student', nullable=False) # 'student' or 'admin'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)

    modules = db.relationship('Module', backref='course', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Course {self.name}>'

class Module(db.Model):
    __tablename__ = 'modules'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)

    topics = db.relationship('Topic', backref='module', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Module {self.name}>'

class Topic(db.Model):
    __tablename__ = 'topics'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    content = db.Column(db.Text, nullable=True) # For articles, notes, etc.
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)

    resources = db.relationship('Resource', backref='topic', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Topic {self.name}>'

class Resource(db.Model):
    __tablename__ = 'resources'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    # Type can be 'pdf', 'video', 'link', 'quiz', etc.
    resource_type = db.Column(db.String(50), nullable=False)
    path_or_url = db.Column(db.String(256), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Resource {self.name}>'
