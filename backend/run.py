from backend.app import create_app, db
from backend.app.models import User, Course, Module, Topic, Resource

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Course': Course,
        'Module': Module,
        'Topic': Topic,
        'Resource': Resource
    }

if __name__ == '__main__':
    app.run()
