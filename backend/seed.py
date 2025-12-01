"""
Script para popular banco de dados com dados iniciais (seed data)
Execute: python seed.py
"""

from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine
from auth import get_password_hash
from datetime import datetime, timedelta

def create_seed_data():
    db = SessionLocal()
    
    try:
        # Criar tabelas
        models.Base.metadata.create_all(bind=engine)
        
        # Verificar se já tem dados
        if db.query(models.User).first():
            print("❌ Banco já tem dados. Abortando seed.")
            return
        
        print("🌱 Criando dados iniciais...")
        
        # --- CLIENTES ---
        print("📋 Criando clientes...")
        clients = [
            models.Client(
                name="Marinha do Brasil - Capitania PR",
                document="00.394.502/0001-44",
                phone="(41) 3721-1500",
                email="logistica.pr@marinha.mil.br",
                address="Paranaguá - PR",
                type="GOVERNO"
            ),
            models.Client(
                name="Roberto Náutica",
                document="123.456.789-00",
                phone="(41) 99999-8888",
                email="roberto@email.com",
                address="Caiobá - PR",
                type="PARTICULAR"
            ),
        ]
        for client in clients:
            db.add(client)
        db.flush()
        
        # --- USUÁRIOS ---
        print("👥 Criando usuários...")
        users = [
            models.User(
                name="Administrador Mare Alta",
                email="admin@marealta.com",
                hashed_password=get_password_hash("123456"),
                role=models.UserRole.ADMIN
            ),
            models.User(
                name="João Técnico",
                email="tecnico@marealta.com",
                hashed_password=get_password_hash("123456"),
                role=models.UserRole.TECHNICIAN
            ),
            models.User(
                name="Roberto Cliente",
                email="cliente@marealta.com",
                hashed_password=get_password_hash("123456"),
                role=models.UserRole.CLIENT,
                client_id=clients[1].id
            ),
        ]
        for user in users:
            db.add(user)
        db.flush()
        
        # --- MARINAS ---
        print("⚓ Criando marinas...")
        marinas = [
            models.Marina(
                name="Iate Clube de Caiobá (ICC)",
                address="Av. do Contorno, s/n - Caiobá",
                contact_name="Secretaria",
                phone="(41) 3452-1011",
                operating_hours="Fecha às Terças"
            ),
            models.Marina(
                name="Marina Bora Bora",
                address="Rod. PR 412, Km 1 - Pontal do Sul",
                contact_name="Atendimento",
                phone="(41) 3455-1555",
                operating_hours="Aberto Todos os dias"
            ),
        ]
        for marina in marinas:
            db.add(marina)
        db.flush()
        
        # --- BARCOS ---
        print("🛥️  Criando embarcações...")
        boats = [
            models.Boat(
                name="Patrulha Costeira 01",
                hull_id="MB-PR-001",
                model="DGS 888 Raptor",
                client_id=clients[0].id,
                marina_id=marinas[1].id,
                usage_type="GOVERNO"
            ),
            models.Boat(
                name="Phantom 303 (Sereia)",
                hull_id="PR-2022-005",
                model="Schaefer Phantom 303",
                client_id=clients[1].id,
                marina_id=marinas[0].id,
                usage_type="LAZER"
            ),
        ]
        for boat in boats:
            db.add(boat)
        db.flush()
        
        # --- MOTORES ---
        print("🔧 Criando motores...")
        boat_engines = [
            models.Engine(
                boat_id=boats[0].id,
                serial_number="2B567890",
                model="Mercury Verado 300 V8",
                hours=150,
                year=2023
            ),
            models.Engine(
                boat_id=boats[1].id,
                serial_number="2B998877",
                model="Mercury Mercruiser 6.2L",
                hours=80,
                year=2022
            ),
        ]
        for eng in boat_engines:
            db.add(eng)
        db.flush()
        
        # --- PEÇAS ---
        print("📦 Criando peças do estoque...")
        parts = [
            models.Part(
                sku="8M0154789",
                barcode="789111222333",
                name="Óleo 25W-40 Synthetic",
                quantity=150,
                cost=45.00,
                price=85.00,
                min_stock=20,
                location="A1-01"
            ),
            models.Part(
                sku="35-8M0065104",
                barcode="789444555666",
                name="Filtro de Óleo Verado",
                quantity=5,
                cost=60.00,
                price=120.00,
                min_stock=10,
                location="A1-02"
            ),
            models.Part(
                sku="47-43026T2",
                barcode="789777888999",
                name="Rotor da Bomba D'água",
                quantity=8,
                cost=90.00,
                price=180.00,
                min_stock=5,
                location="B2-10"
            ),
        ]
        for part in parts:
            db.add(part)
        db.flush()
        
        # --- ORDENS DE SERVIÇO ---
        print("🔨 Criando ordens de serviço...")
        orders = [
            models.ServiceOrder(
                boat_id=boats[0].id,
                engine_id=boat_engines[0].id,
                description="Revisão de 100 horas",
                status=models.OSStatus.IN_PROGRESS,
                requester="Marinha do Brasil",
                technician_name="João Técnico",
                total_value=0,
                created_at=datetime.now() - timedelta(days=2)
            ),
            models.ServiceOrder(
                boat_id=boats[1].id,
                engine_id=boat_engines[1].id,
                description="Troca de óleo e filtros",
                status=models.OSStatus.PENDING,
                requester="Roberto Cliente",
                total_value=0,
                created_at=datetime.now() - timedelta(days=1)
            ),
        ]
        for order in orders:
            db.add(order)
        db.flush()
        
        # --- ITENS DAS ORDENS ---
        print("🛠️  Adicionando itens às ordens...")
        items = [
            # Ordem 1
            models.ServiceItem(
                order_id=orders[0].id,
                type=models.ItemType.PART,
                description=parts[0].name,
                part_id=parts[0].id,
                quantity=4,
                unit_cost=parts[0].cost,
                unit_price=parts[0].price,
                total=parts[0].price * 4
            ),
            models.ServiceItem(
                order_id=orders[0].id,
                type=models.ItemType.LABOR,
                description="Mão de Obra Especializada",
                quantity=1,
                unit_cost=0,
                unit_price=800,
                total=800
            ),
            # Ordem 2
            models.ServiceItem(
                order_id=orders[1].id,
                type=models.ItemType.PART,
                description=parts[1].name,
                part_id=parts[1].id,
                quantity=2,
                unit_cost=parts[1].cost,
                unit_price=parts[1].price,
                total=parts[1].price * 2
            ),
        ]
        for item in items:
            db.add(item)
        
        # Recalcular totais das ordens
        for order in orders:
            order.total_value = sum(i.total for i in items if i.order_id == order.id)
        
        db.flush()
        
        # Commit tudo
        db.commit()
        
        print("✅ Seed completo!")
        print(f"   - {len(clients)} clientes")
        print(f"   - {len(users)} usuários")
        print(f"   - {len(marinas)} marinas")
        print(f"   - {len(boats)} barcos")
        print(f"   - {len(parts)} peças")
        print(f"   - {len(orders)} ordens de serviço")
        print("\n🔑 Credenciais de login:")
        print("   Admin: admin@marealta.com / 123456")
        print("   Técnico: tecnico@marealta.com / 123456")
        print("   Cliente: cliente@marealta.com / 123456")
        
    except Exception as e:
        print(f"❌ Erro ao criar seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_seed_data()
