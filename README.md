# nbresource

NB Resource (nbresource) is a small extension for Jupyter Notebooks that
displays an indication of how much resources your jupyter server and
its children (kernels, terminals, etc) are using.

## Installation

You can currently install this package from PyPI.

```bash
pip install git+https://github.com/wixb50/nbresource.git
```

**If your notebook version is < 5.3**, you need to enable the extension manually.

```
jupyter serverextension enable --py nbresource --sys-prefix
jupyter nbextension install --py nbresource --sys-prefix
jupyter nbextension enable --py nbresource --sys-prefix
```
