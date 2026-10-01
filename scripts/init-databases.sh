#!/bin/bash
set -e

# This script creates multiple databases in PostgreSQL
# It's executed when the PostgreSQL container starts for the first time

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create databases for each microservice
    
    -- Product Service Database
    CREATE DATABASE "ProductDb";
    GRANT ALL PRIVILEGES ON DATABASE "ProductDb" TO $POSTGRES_USER;
    
    -- Order Service Database
    CREATE DATABASE "OrderDb";
    GRANT ALL PRIVILEGES ON DATABASE "OrderDb" TO $POSTGRES_USER;
    
    -- Payment Service Database
    CREATE DATABASE "PaymentDb";
    GRANT ALL PRIVILEGES ON DATABASE "PaymentDb" TO $POSTGRES_USER;
    
    -- Identity Service Database
    CREATE DATABASE "IdentityDb";
    GRANT ALL PRIVILEGES ON DATABASE "IdentityDb" TO $POSTGRES_USER;
    
    -- Cart Service Database (if using PostgreSQL instead of Redis only)
    CREATE DATABASE "CartDb";
    GRANT ALL PRIVILEGES ON DATABASE "CartDb" TO $POSTGRES_USER;
    
    -- Inventory Service Database (Java)
    CREATE DATABASE "InventoryDb";
    GRANT ALL PRIVILEGES ON DATABASE "InventoryDb" TO $POSTGRES_USER;
    
    -- Shipping Service Database (Java)
    CREATE DATABASE "ShippingDb";
    GRANT ALL PRIVILEGES ON DATABASE "ShippingDb" TO $POSTGRES_USER;
    
    -- Recommendation Service Database (Python)
    CREATE DATABASE "RecommendationDb";
    GRANT ALL PRIVILEGES ON DATABASE "RecommendationDb" TO $POSTGRES_USER;
    
    -- Notification Service Database
    CREATE DATABASE "NotificationDb";
    GRANT ALL PRIVILEGES ON DATABASE "NotificationDb" TO $POSTGRES_USER;
    
    -- Review Service Database
    CREATE DATABASE "ReviewDb";
    GRANT ALL PRIVILEGES ON DATABASE "ReviewDb" TO $POSTGRES_USER;
    
EOSQL

echo "All databases created successfully!"
