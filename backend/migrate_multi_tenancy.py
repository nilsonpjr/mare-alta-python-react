"""
Migration Script: Add tenant_id to all tables for Multi-Tenancy support
This script adds the tenant_id column to all relevant tables
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Index, create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, engine
import models

def add_tenant_support():
    """
    Add tenant_id column to all tables that need multi-tenancy support
    """
    print("🚀 Starting Multi-Tenancy Migration...")
    
    # Tables that need tenant_id
    tables_to_modify = [
        'users',
        'clients', 
        'marinas',
        'boats',
        'engines',
        'parts',
        'service_orders',
        'service_items',
        'order_notes',
        'invoices',
        'stock_movements',
        'transactions',
        'manufacturers',
        'models'
    ]
    
    with engine.connect() as conn:
        # First, create tenants table if it doesn't exist
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL UNIQUE,
                cnpj VARCHAR(50),
                subdomain VARCHAR(100) UNIQUE,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Create default tenant "Mare Alta" if doesn't exist
        result = conn.execute("SELECT id FROM tenants WHERE name = 'Mare Alta'")
        default_tenant = result.fetchone()
        
        if not default_tenant:
            conn.execute("""
                INSERT INTO tenants (id, name, cnpj, subdomain, is_active) 
                VALUES (1, 'Mare Alta', '00.000.000/0001-00', 'marealta', 1)
            """)
            conn.commit()
            print("✅ Created default tenant: Mare Alta")
            default_tenant_id = 1
        else:
            default_tenant_id = default_tenant[0]
            print(f"✅ Default tenant already exists with ID: {default_tenant_id}")
        
        # Add tenant_id to each table
        for table in tables_to_modify:
            try:
                # Check if column already exists
                result = conn.execute(f"PRAGMA table_info({table})")
                columns = [row[1] for row in result.fetchall()]
                
                if 'tenant_id' not in columns:
                    # Add column
                    conn.execute(f"""
                        ALTER TABLE {table} 
                        ADD COLUMN tenant_id INTEGER DEFAULT {default_tenant_id} REFERENCES tenants(id)
                    """)
                    
                    # Set all existing records to default tenant
                    conn.execute(f"UPDATE {table} SET tenant_id = {default_tenant_id}")
                    
                    conn.commit()
                    print(f"✅ Added tenant_id to {table}")
                else:
                    print(f"⏭️  {table} already has tenant_id column")
                    
            except Exception as e:
                print(f"❌ Error modifying {table}: {e}")
                conn.rollback()
        
        print("\n🎉 Multi-Tenancy Migration Complete!")
        print(f"📊 All existing data assigned to tenant: Mare Alta (ID: {default_tenant_id})")

if __name__ == "__main__":
    add_tenant_support()
