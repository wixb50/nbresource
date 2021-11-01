from notebook.utils import url_path_join

from .handler import ResourceHandler


def _jupyter_server_extension_paths():
    return [{
        'module': 'nbresource',
    }]


def _jupyter_nbextension_paths():
    return [{
        "section": "tree",
        "dest": "nbresource",
        "src": "static",
        "require": "nbresource/tree"
    }]


def load_jupyter_server_extension(nbapp):
    resource_url = url_path_join(nbapp.web_app.settings['base_url'], '/nbresource/(.*)')
    handlers = [
        (resource_url, ResourceHandler),
    ]
    nbapp.web_app.add_handlers('.*', handlers)
