# Oracle Cloud Deployment Guide for CRM Application

## Prerequisites
- Oracle Cloud Infrastructure (OCI) account
- OCI CLI installed and configured
- Docker installed
- kubectl configured for OKE

## 1. Infrastructure Setup

### Create Autonomous Database
```bash
# Create compartment for CRM
oci iam compartment create --name "crm-production" --description "CRM Production Environment"

# Create Autonomous Database
oci db autonomous-database create \
  --compartment-id <compartment-ocid> \
  --display-name "CRM-Database" \
  --db-name "CRMDB" \
  --cpu-core-count 1 \
  --data-storage-size-in-tbs 1 \
  --admin-password "<secure-password>"
```

### Setup Container Registry
```bash
# Create container registry
oci artifacts container repository create \
  --compartment-id <compartment-ocid> \
  --display-name "crm-app"
```

### Create Kubernetes Cluster (OKE)
```bash
# Create OKE cluster
oci ce cluster create \
  --compartment-id <compartment-ocid> \
  --name "crm-cluster" \
  --vcn-id <vcn-ocid> \
  --kubernetes-version "v1.28.2" \
  --service-lb-subnet-ids '["<subnet-ocid>"]'
```

## 2. Application Configuration

### Environment Variables for Oracle Cloud
```bash
# Create .env.oracle file
cat > .env.oracle << EOF
CLOUD_PROVIDER=oracle
ORACLE_DB_URL=<autonomous-db-connection-string>
ORACLE_DB_USER=CRM_USER
ORACLE_DB_PASSWORD=<password>
ORACLE_STORAGE_BUCKET=crm-storage
ORACLE_REGION=us-ashburn-1
ORACLE_FUNCTIONS_URL=<functions-endpoint>
ORACLE_VAULT_SERVICE=<vault-ocid>
EOF
```

### Dockerfile for Oracle Cloud
```dockerfile
# Create Dockerfile.oracle
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build for production
RUN npm run build

# Install Oracle Instant Client for database connectivity
RUN apk add --no-cache libaio libnsl libc6-compat curl && \
    curl -o instantclient.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip instantclient.zip && \
    mv instantclient*/ /opt/oracle/instantclient && \
    rm instantclient.zip

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH

EXPOSE 3000

CMD ["npm", "start"]
```

## 3. Database Migration

### Oracle Schema Creation Script
```sql
-- Create CRM user and schema
CREATE USER crm_user IDENTIFIED BY "<password>";
GRANT CONNECT, RESOURCE, CREATE SESSION TO crm_user;
GRANT UNLIMITED TABLESPACE TO crm_user;

-- Create tables (converted from Supabase schema)
CREATE TABLE crm_user.leads (
    id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    user_id RAW(16) NOT NULL,
    name VARCHAR2(255) NOT NULL,
    email VARCHAR2(255) NOT NULL,
    phone VARCHAR2(50),
    location VARCHAR2(255),
    stage VARCHAR2(50) DEFAULT 'Initial Contact',
    priority VARCHAR2(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create VPD policies (Oracle's RLS equivalent)
CREATE OR REPLACE FUNCTION crm_user.leads_policy_function (
    schema_var IN VARCHAR2,
    table_var IN VARCHAR2
) RETURN VARCHAR2 IS
BEGIN
    RETURN 'user_id = SYS_CONTEXT(''USERENV'', ''SESSION_USER_ID'')';
END;

-- Apply VPD policy
BEGIN
    DBMS_RLS.ADD_POLICY(
        object_schema => 'CRM_USER',
        object_name => 'LEADS',
        policy_name => 'LEADS_SECURITY_POLICY',
        function_schema => 'CRM_USER',
        policy_function => 'leads_policy_function',
        statement_types => 'SELECT,INSERT,UPDATE,DELETE'
    );
END;
```

## 4. Kubernetes Deployment

### Deployment YAML
```yaml
# k8s/crm-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crm-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crm-app
  template:
    metadata:
      labels:
        app: crm-app
    spec:
      containers:
      - name: crm-app
        image: <region>.ocir.io/<tenancy>/crm-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: CLOUD_PROVIDER
          value: "oracle"
        - name: ORACLE_DB_URL
          valueFrom:
            secretKeyRef:
              name: oracle-secrets
              key: db-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: crm-service
spec:
  selector:
    app: crm-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 5. Oracle Functions Migration

### Convert Supabase Edge Functions
```javascript
// oracle-functions/audit-log/func.js
const fdk = require('@fnproject/fdk');
const oracledb = require('oracledb');

fdk.handle(async function (input) {
    const connection = await oracledb.getConnection({
        user: process.env.ORACLE_DB_USER,
        password: process.env.ORACLE_DB_PASSWORD,
        connectionString: process.env.ORACLE_DB_URL
    });

    try {
        const result = await connection.execute(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
             VALUES (:user_id, :action, :table_name, :record_id, :old_values, :new_values)`,
            {
                user_id: input.user_id,
                action: input.action,
                table_name: input.table_name,
                record_id: input.record_id,
                old_values: JSON.stringify(input.old_values),
                new_values: JSON.stringify(input.new_values)
            }
        );

        await connection.commit();
        return { success: true, audit_log_id: result.insertId };
    } finally {
        await connection.close();
    }
});
```

## 6. Security Configuration

### Oracle Cloud Guard Setup
```bash
# Enable Cloud Guard
oci cloud-guard configuration update \
  --status ENABLED \
  --reporting-region <region>

# Create detector recipe
oci cloud-guard detector-recipe create \
  --compartment-id <compartment-ocid> \
  --display-name "CRM Security Recipe"
```

### IAM Policies
```bash
# Create IAM policies for CRM application
oci iam policy create \
  --compartment-id <compartment-ocid> \
  --name "CRM-App-Policies" \
  --statements '[
    "Allow group CRM-Developers to manage autonomous-database in compartment crm-production",
    "Allow group CRM-Developers to manage buckets in compartment crm-production",
    "Allow group CRM-Developers to manage functions-family in compartment crm-production"
  ]'
```

## 7. Monitoring and Logging

### Application Performance Monitoring
```bash
# Create APM domain
oci apm apm-domain create \
  --compartment-id <compartment-ocid> \
  --display-name "CRM-APM" \
  --description "CRM Application Performance Monitoring"
```

## 8. Deployment Commands

### Build and Deploy
```bash
# Build Docker image
docker build -f Dockerfile.oracle -t crm-app .

# Tag for Oracle Container Registry
docker tag crm-app <region>.ocir.io/<tenancy>/crm-app:latest

# Push to registry
docker push <region>.ocir.io/<tenancy>/crm-app:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

## 9. SSL/TLS Configuration

### Certificate Management
```bash
# Create load balancer with SSL
oci lb load-balancer create \
  --compartment-id <compartment-ocid> \
  --display-name "CRM-LoadBalancer" \
  --shape-name "flexible" \
  --subnet-ids '["<subnet-ocid>"]' \
  --shape-details '{"minimumBandwidthInMbps": 10, "maximumBandwidthInMbps": 100}'
```

## 10. Backup and Disaster Recovery

### Automated Backups
```bash
# Enable automatic backups for Autonomous Database
oci db autonomous-database update \
  --autonomous-database-id <adb-ocid> \
  --backup-retention-period-in-days 30
```

This deployment guide ensures your CRM application runs securely and efficiently on Oracle Cloud Infrastructure with enterprise-grade security and scalability.