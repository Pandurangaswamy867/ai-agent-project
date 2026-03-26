import pytest
from sqlalchemy.orm import Session
from models import MSE, Product
from sqlalchemy.exc import IntegrityError

def test_create_mse(db_session: Session):
    # DB-01: Create MSE record
    mse = MSE(
        name="Test MSE",
        contact_person="John Doe",
        email="test@mse.com",
        phone="1234567890",
        address="123 Street",
        city="Test City",
        state="TS",
        pincode="123456",
        sector="Textiles",
        description="A test MSE business"
    )
    db_session.add(mse)
    db_session.commit()
    db_session.refresh(mse)
    
    assert mse.mse_id is not None
    assert mse.name == "Test MSE"
    assert mse.status == "pending"


def test_create_product_attributes(db_session: Session):
    # DB-03: Create product with JSON attributes
    mse = MSE(
        name="Product MSE",
        email="prod@test.com",
        phone="3333333333",
        address="Addr 3",
        city="City 3",
        state="ST",
        pincode="333333",
        description="Desc 3"
    )
    db_session.add(mse)
    db_session.commit()
    db_session.refresh(mse)
    
    product = Product(
        mse_id=mse.mse_id,
        product_name="Cotton Saree",
        description="Red cotton saree",
        price=1500.0,
        unit="pcs",
        attributes='{"color": "Red", "material": "Cotton"}'
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    assert product.product_id is not None
    assert product.attributes == '{"color": "Red", "material": "Cotton"}'

def test_cascade_delete_mse(db_session: Session):
    # DB-04: Cascade delete MSE
    mse = MSE(
        name="Delete MSE",
        email="delete@test.com",
        phone="4444444444",
        address="Addr 4",
        city="City 4",
        state="ST",
        pincode="444444",
        description="Desc 4"
    )
    db_session.add(mse)
    db_session.commit()
    db_session.refresh(mse)
    
    prod = Product(
        mse_id=mse.mse_id,
        product_name="To be deleted",
        description="Desc",
        price=10.0,
        unit="pcs"
    )
    db_session.add(prod)
    db_session.commit()
    
    db_session.delete(mse)
    db_session.commit()
    
    remaining_prods = db_session.query(Product).filter(Product.mse_id == mse.mse_id).all()
    assert len(remaining_prods) == 0

def test_snp_domain_expertise(db_session: Session):
    # DB-05: SNP domain expertise JSON
    from models import SNP
    snp = SNP(
        name="Logistics Expert",
        type="Logistics",
        email="expert@snp.com",
        phone="9999999999",
        city="Mumbai",
        supported_sectors='["Textiles", "Agro"]'
    )
    db_session.add(snp)
    db_session.commit()
    db_session.refresh(snp)
    
    assert snp.supported_sectors == '["Textiles", "Agro"]'
