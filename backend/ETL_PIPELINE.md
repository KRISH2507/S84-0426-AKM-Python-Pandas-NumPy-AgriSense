# ETL Data Pipeline Automation

## Data Sources
- AGMARKNET API (daily mandi prices)
- IMD Weather API (hourly updates)
- Soil Health Card data (quarterly)
- Crop yield reports (seasonal)

## Pipeline Stages
1. Extract: Fetch from APIs with retry logic
2. Transform: Clean, normalize, validate
3. Load: Bulk insert into PostgreSQL

## Orchestration
- Apache Airflow for DAG management
- Scheduled runs: Daily at 2 AM IST
- Data quality checks at each stage
- Failure notifications via email

## Data Validation
- Schema validation with Pydantic
- Outlier detection for prices
- Completeness checks (no missing dates)
