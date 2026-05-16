import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import sys
import io

# Fix encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

def train_sensor_model(df, sensor_type, target_col, model_name):
    print(f"\n--- Training model for {sensor_type} ({target_col}) ---")
    
    # Filter data for this sensor type
    sub_df = df[df['Sensor_Type'] == sensor_type].copy()
    sub_df = sub_df.dropna(subset=[target_col])
    
    if len(sub_df) < 100:
        print(f"Not enough data for {sensor_type}. Skipping.")
        return
    
    # Encode Categorical Features
    le_city = LabelEncoder()
    le_street = LabelEncoder()
    le_services = LabelEncoder()
    
    sub_df['City_Enc'] = le_city.fit_transform(sub_df['City'].astype(str))
    sub_df['Street_Type_Enc'] = le_street.fit_transform(sub_df['Street_Type'].astype(str))
    sub_df['Nearby_Services_Enc'] = le_services.fit_transform(sub_df['Nearby_Services'].astype(str))
    
    # Handle Lat/Long
    sub_df['Latitude'] = pd.to_numeric(sub_df['Latitude'], errors='coerce').fillna(sub_df['Latitude'].dropna().astype(float).mean() if not sub_df['Latitude'].dropna().empty else 0)
    sub_df['Longitude'] = pd.to_numeric(sub_df['Longitude'], errors='coerce').fillna(sub_df['Longitude'].dropna().astype(float).mean() if not sub_df['Longitude'].dropna().empty else 0)
    
    X = sub_df[['City_Enc', 'Street_Type_Enc', 'Nearby_Services_Enc', 'Hour', 'DayOfWeek', 'Latitude', 'Longitude']]
    y = sub_df[target_col]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train
    # Using small n_estimators and max_depth for speed in this environment
    model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate
    score = model.score(X_test, y_test)
    print(f"R^2 Score for {model_name}: {score:.4f}")
    
    # Save
    model_dir = 'models'
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        
    joblib.dump(model, f'{model_dir}/{model_name}.pkl')
    joblib.dump({'city': le_city, 'street': le_street, 'services': le_services}, f'{model_dir}/{model_name}_encoders.pkl')
    print(f"Saved {model_name} to {model_dir}/")

def main():
    file_path = 'archive/smart_city_sensor_data.csv'
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        sys.exit(1)
        
    print("Loading dataset...")
    df = pd.read_csv(file_path)
    df.columns = ['City', 'Sensor_ID', 'Latitude', 'Longitude', 'Timestamp', 
                  'Sensor_Type', 'Street_Type', 'Nearby_Services', 
                  'Vehicle_Count', 'kWh', 'Occupancy_Rate', 'Noise_Level']
    
    print(f"Dataset loaded: {len(df)} rows.")
    
    # Preprocess Timestamp
    df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')
    df = df.dropna(subset=['Timestamp'])
    df['Hour'] = df['Timestamp'].dt.hour
    df['DayOfWeek'] = df['Timestamp'].dt.dayofweek
    
    # Train models for different sensor types
    sensor_tasks = [
        ('Trafik Sayacı', 'Vehicle_Count', 'traffic_prediction'),
        ('Enerji Metre', 'kWh', 'energy_consumption'),
        ('Atık Sensörü', 'Occupancy_Rate', 'waste_occupancy'),
        ('Çevre Sensörü', 'Noise_Level', 'noise_prediction')
    ]
    
    for s_type, target, m_name in sensor_tasks:
        try:
            train_sensor_model(df, s_type, target, m_name)
        except Exception as e:
            # Avoid printing full exception if it's an encoding issue during print
            print(f"Failed to train {m_name}")
            # If it's not a print issue, we might want to know
            if not isinstance(e, UnicodeEncodeError):
                print(f"Error detail: {e}")

    print("\nTraining complete. Models are stored in the 'models/' directory.")

if __name__ == "__main__":
    main()
