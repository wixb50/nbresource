from glob import glob
import setuptools

setuptools.setup(
    name="nbresource",
    version='0.1.0',
    url="https://github.com/wixb50/nbresource",
    author="wixb50",
    description="Simple Jupyter extension to show how much resources (RAM) your notebook is using",
    packages=setuptools.find_packages(),
    install_requires=[
        'psutil',
        'notebook',
    ],
    data_files=[
        ('share/jupyter/nbextensions/nbresource', glob('nbresource/static/*')),
        ('etc/jupyter/jupyter_notebook_config.d', ['nbresource/etc/serverextension.json']),
        ('etc/jupyter/nbconfig/notebook.d', ['nbresource/etc/nbextension.json'])
    ],
    zip_safe=False,
    include_package_data=True
)
