# Backup & Disaster Recovery Plan

## Backup Strategy
- Full database backup: Daily at 3 AM IST
- Incremental backups: Every 6 hours
- ML model snapshots: After each training
- Configuration backups: On every change

## Storage
- Primary: AWS S3 (Standard tier)
- Archive: S3 Glacier (after 90 days)
- Retention: 30 days for daily, 1 year for monthly
- Cross-region replication (Mumbai → Singapore)

## Recovery Procedures
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 6 hours
- Automated restore scripts
- Regular disaster recovery drills (quarterly)

## Monitoring
- Backup success/failure alerts
- Storage capacity monitoring
- Restore test automation
- Backup integrity verification
