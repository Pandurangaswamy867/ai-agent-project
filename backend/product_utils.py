def categorize_product_ai(product_name: str):
    product_name = product_name.lower()
    if any(word in product_name for word in ["rice", "wheat", "dal"]):
        return "staples"
    elif any(word in product_name for word in ["soap", "shampoo"]):
        return "personal_care"
    else:
        return "general"

def get_classifier():
    return None