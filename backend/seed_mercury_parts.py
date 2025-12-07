"""
Script to populate inventory with all parts from Maintenance Kits
This ensures all Mercury parts referenced in maintenance_kits.ts exist in the inventory
"""

import sys
sys.path.append('..')

from frontend.data.maintenance_kits import INITIAL_MAINTENANCE_KITS

# Extract all unique parts from maintenance kits
parts_catalog = {}

for kit in INITIAL_MAINTENANCE_KITS:
    for part in kit['parts']:
        pn = part['partNumber']
        if pn not in parts_catalog:
            parts_catalog[pn] = {
                'sku': pn,
                'name': part['name'],
                'price': part['unitPrice'],
                'cost': part['unitPrice'] * 0.65,  # Assuming 35% markup
                'quantity': 0,  # Start with 0, will be filled when inventory arrives
                'minStock': 2,
                'location': 'A1-MERCURY'
            }

# Generate SQL INSERT statements
print("-- Mercury Parts from Maintenance Kits\n")
print("-- Add these to your inventory seed data\n")

for sku, part_data in parts_catalog.items():
    print(f"({part_data['sku']!r}, '', {part_data['name']!r}, {part_data['quantity']}, "
          f"{part_data['cost']:.2f}, {part_data['price']:.2f}, {part_data['minStock']}, "
          f"{part_data['location']!r}),")

print(f"\n-- Total: {len(parts_catalog)} unique Mercury parts")
