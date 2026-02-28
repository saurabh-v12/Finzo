from datetime import datetime
from collections import defaultdict

def validate_category(merchant, description, ai_category):
    """
    Overrides AI category based on strict keyword rules for merchant names.
    """
    merchant_lower = merchant.lower() if merchant else ""
    
    # Food & Dining
    food_keywords = [
        "swiggy", "zomato", "dominos", "mcdonald", "kfc", 
        "restaurant", "cafe", "pizza", "burger", "coffee", "tea"
    ]
    if any(k in merchant_lower for k in food_keywords):
        return "Food"
        
    # Transport
    transport_keywords = [
        "uber", "ola", "rapido", "metro", "petrol", "fuel", "shell", "hpcl", "bpcl"
    ]
    if any(k in merchant_lower for k in transport_keywords):
        return "Transport"
        
    # Shopping
    shopping_keywords = [
        "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "shopping", "retail"
    ]
    if any(k in merchant_lower for k in shopping_keywords):
        return "Shopping"
        
    # Entertainment
    entertainment_keywords = [
        "netflix", "spotify", "hotstar", "prime", "youtube premium", 
        "cinema", "movie", "bookmyshow"
    ]
    if any(k in merchant_lower for k in entertainment_keywords):
        return "Entertainment"
        
    # Health
    health_keywords = [
        "apollo", "medplus", "1mg", "hospital", "clinic", "doctor", "pharmacy"
    ]
    if any(k in merchant_lower for k in health_keywords):
        return "Health"
        
    # Investment
    investment_keywords = [
        "sip", "mutual fund", "zerodha", "groww", "nps", "investment", "broker"
    ]
    if any(k in merchant_lower for k in investment_keywords):
        return "Investment"
        
    # Income
    income_keywords = [
        "salary", "neft inward", "credited by"
    ]
    if any(k in merchant_lower for k in income_keywords):
        return "Income"
        
    # Utilities
    utilities_keywords = [
        "electricity", "bescom", "mseb", "water", "internet", "airtel", "jio", "vodafone", "bill"
    ]
    if any(k in merchant_lower for k in utilities_keywords):
        return "Utilities"
        
    # Education
    education_keywords = [
        "school", "college", "udemy", "coursera", "education", "learning"
    ]
    if any(k in merchant_lower for k in education_keywords):
        return "Education"
        
    # Housing
    housing_keywords = [
        "emi", "home loan", "car loan", "rent", "housing"
    ]
    if any(k in merchant_lower for k in housing_keywords):
        return "Housing"
        
    # Return AI category if no rules match
    return ai_category

def detect_recurring(transactions):
    """
    Detects recurring transactions based on merchant name, amount similarity, and date patterns.
    transactions: List of transaction dictionaries/objects.
    Returns: List with 'is_recurring' flag updated.
    """
    # Group by merchant
    merchant_groups = defaultdict(list)
    
    # Helper to access attributes whether it's a dict or object
    def get_attr(item, key):
        if isinstance(item, dict):
            return item.get(key)
        return getattr(item, key, None)
    
    # Helper to set attributes
    def set_attr(item, key, value):
        if isinstance(item, dict):
            item[key] = value
        else:
            setattr(item, key, value)

    for tx in transactions:
        merchant = get_attr(tx, 'merchant')
        if merchant:
            merchant_groups[merchant].append(tx)
            
    for merchant, tx_list in merchant_groups.items():
        if len(tx_list) < 3:
            continue
            
        # Sort by date
        # Assuming date string format, ideally should parse to datetime object for comparison
        # For this simplified version, we'll try to parse common formats or rely on passed objects having parsed dates
        # If dates are strings like '2026-02-27', sorting works.
        
        try:
            # Sort chronologically
            tx_list.sort(key=lambda x: get_attr(x, 'date'))
            
            # Check for patterns
            is_recurring_merchant = False
            
            # Check amounts (within 10%)
            amounts = [float(get_attr(tx, 'amount')) for tx in tx_list]
            avg_amount = sum(amounts) / len(amounts)
            
            amount_variance_ok = all(abs(a - avg_amount) / avg_amount < 0.1 for a in amounts)
            
            # Check dates (monthly pattern - roughly same day of month)
            # This requires parsing the date string. Assuming ISO format YYYY-MM-DD or similar
            days = []
            valid_dates = True
            
            for tx in tx_list:
                date_str = get_attr(tx, 'date')
                try:
                    # Try parsing YYYY-MM-DD
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                    days.append(dt.day)
                except:
                    valid_dates = False
                    break
            
            if valid_dates and amount_variance_ok:
                # Check if days are within 5 days range
                # e.g. 5th, 6th, 4th -> OK. 5th, 20th -> Not OK.
                # Simple check: max(days) - min(days) <= 5 (doesn't handle month boundary wrapping well but simple for now)
                # Better: Standard deviation or circular mean, but let's stick to simple range for MVP
                
                # Handle month wrapping edge case roughly (e.g. 30th and 1st)
                # If variance is high, check if days are near start/end of month
                
                sorted_days = sorted(days)
                range_diff = sorted_days[-1] - sorted_days[0]
                
                if range_diff <= 5:
                    is_recurring_merchant = True
                
            if is_recurring_merchant:
                for tx in tx_list:
                    set_attr(tx, 'is_recurring', True)
                    
        except Exception as e:
            # If parsing fails or data is bad, skip this merchant
            print(f"Error detecting recurring for {merchant}: {e}")
            continue
            
    return transactions
