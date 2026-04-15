from setuptools import setup, find_packages

setup(
    name="devmetrics-ml",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.10",
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "pyarrow>=14.0.0",
        "psycopg2-binary>=2.9.0",
        "sqlalchemy>=2.0.0",
        "redis>=5.0.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
    ],
)