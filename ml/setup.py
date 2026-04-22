from setuptools import setup, find_packages

setup(
    name="devmetrics-ml",
    version="0.1.0",
    description="ML pipeline for Technical Debt Prediction in DevMetrics",
    author="Oscar Casas",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.11",
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "xgboost>=2.0.0",
        "psycopg2-binary>=2.9.0",
        "redis>=5.0.0",
        "mlflow>=2.8.0",
        "pyyaml>=6.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        "fastapi>=0.104.0",
        "uvicorn>=0.24.0",
    ],
    extras_require={
        "dev": [
            "jupyter>=1.0.0",
            "pytest>=7.4.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "matplotlib>=3.7.0",
            "seaborn>=0.12.0",
        ]
    },
)