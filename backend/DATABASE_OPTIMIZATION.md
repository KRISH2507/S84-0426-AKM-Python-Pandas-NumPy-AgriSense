# Database Performance Optimization Guide

## Index Strategy
- Composite indexes on (crop_id, state, date) for market_data queries
- B-tree indexes on frequently filtered columns
- Partial indexes for active records only

## Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Implement connection pooling (max 20 connections)
- Enable query result caching for static crop data
