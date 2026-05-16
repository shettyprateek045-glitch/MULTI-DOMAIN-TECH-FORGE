import joblib
import pandas as pd
import os

def predict_value(model_name, city, street_type, nearby_services, hour, day_of_week, lat, lon):
    model_path = f'models/{model_name}.pkl'
    encoder_path = f'models/{model_name}_encoders.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(encoder_path):
        return f"Model {model_name} not found."
    
    model = joblib.load(model_path)
    encoders = joblib.load(encoder_path)
    
    # Encode inputs
    try:
        city_enc = encoders['city'].transform([city])[0]
    except:
        city_enc = 0 # Default/Unknown
        
    try:
        street_enc = encoders['street'].transform([street_type])[0]
    except:
        street_enc = 0
        
    try:
        services_enc = encoders['services'].transform([nearby_services])[0]
    except:
        services_enc = 0
        
    # Create feature array
    X = pd.DataFrame([[city_enc, street_enc, services_enc, hour, day_of_week, lat, lon]],
                     columns=['City_Enc', 'Street_Type_Enc', 'Nearby_Services_Enc', 'Hour', 'DayOfWeek', 'Latitude', 'Longitude'])
    
    prediction = model.predict(X)[0]
    return prediction

if __name__ == "__main__":
    # Example: Predict Energy Consumption in Istanbul on a Monday at 10 AM
    val = predict_value('energy_consumption', 'Istanbul', 'Ticari Alan', 'Ofis Binası', 10, 0, 40.99, 29.02)
    print(f"Predicted Energy (kWh): {val:.2f}")
    
    # Example: Predict Traffic in Ankara on a Friday at 5 PM
    val = predict_value('traffic_prediction', 'Ankara', 'Ana Cadde', 'Hükümet Binası', 17, 4, 39.94, 32.86)
    print(f"Predicted Traffic (Vehicles): {val:.0f}")
