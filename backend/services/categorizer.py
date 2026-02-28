from datetime import datetime
from collections import defaultdict

def validate_category(merchant, description, ai_category):

    merchant_lower = merchant.lower() if merchant else ""
    
    food_keywords = [
        "swiggy", "zomato", "dominos", "mcdonald", "kfc", 
        "restaurant", "cafe", "pizza", "burger", "coffee", "tea"
    ]
    if any(k in merchant_lower for k in food_keywords):
        return "Food"
        
    transport_keywords = [
        "uber", "ola", "rapido", "metro", "petrol", "fuel", "shell", "hpcl", "bpcl"
    ]
    if any(k in merchant_lower for k in transport_keywords):
        return "Transport"
        
    shopping_keywords = [
        "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "shopping", "retail"
    ]
    if any(k in merchant_lower for k in shopping_keywords):
        return "Shopping"
        
    entertainment_keywords = [
        "netflix", "spotify", "hotstar", "prime", "youtube premium", 
        "cinema", "movie", "bookmyshow"
    ]
    if any(k in merchant_lower for k in entertainment_keywords):
        return "Entertainment"
        
    health_keywords = [
        "apollo", "medplus", "1mg", "hospital", "clinic", "doctor", "pharmacy"
    ]
    if any(k in merchant_lower for k in health_keywords):
        return "Health"
        
    investment_keywords = [
        "sip", "mutual fund", "zerodha", "groww", "nps", "investment", "broker"
    ]
    if any(k in merchant_lower for k in investment_keywords):
        return "Investment"
        
    income_keywords = [
        "salary", "neft inward", "credited by"
    ]
    if any(k in merchant_lower for k in income_keywords):
        return "Income"
        
    utilities_keywords = [
        "electricity", "bescom", "mseb", "water", "internet", "airtel", "jio", "vodafone", "bill"
    ]
    if any(k in merchant_lower for k in utilities_keywords):
        return "Utilities"
        
    education_keywords = [
        "school", "college", "udemy", "coursera", "education", "learning"
    ]
    if any(k in merchant_lower for k in education_keywords):
        return "Education"
        
    housing_keywords = [
        "emi", "home loan", "car loan", "rent", "housing"
    ]
    if any(k in merchant_lower for k in housing_keywords):
        return "Housing"
        
    return ai_category


def detect_recurring(transactions):

    merchant_groups = defaultdict(list)
    
    def get_attr(item, key):
        if isinstance(item, dict):
            return item.get(key)
        return getattr(item, key, None)
    
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
            
        try:
            tx_list.sort(key=lambda x: get_attr(x, 'date'))
            
            is_recurring_merchant = False
            
            amounts = [float(get_attr(tx, 'amount')) for tx in tx_list]
            avg_amount = sum(amounts) / len(amounts)
            
            amount_variance_ok = all(abs(a - avg_amount) / avg_amount < 0.1 for a in amounts)
            
            days = []
            valid_dates = True
            
            for tx in tx_list:
                date_str = get_attr(tx, 'date')
                try:
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                    days.append(dt.day)
                except:
                    valid_dates = False
                    break
            
            if valid_dates and amount_variance_ok:
                
                sorted_days = sorted(days)
                range_diff = sorted_days[-1] - sorted_days[0]
                
                if range_diff <= 5:
                    is_recurring_merchant = True
                
            if is_recurring_merchant:
                for tx in tx_list:
                    set_attr(tx, 'is_recurring', True)
                    
        except Exception as e:
            print(f"Error detecting recurring for {merchant}: {e}")
            continue
            
    return transactions
