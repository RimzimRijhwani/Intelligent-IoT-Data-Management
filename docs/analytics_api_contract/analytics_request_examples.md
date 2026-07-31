## 1. Single-Sensor Request (Models)

This example shows how the Backend sends data from one sensor to the Models service for anomaly detection.

# Example

```json
{
  "timestamp": "2026-07-31T20:30:00+10:00",
  "sensor_id": "sensor_01",
  "value": 28.5,
  "detector": "ECOD",
  "parameters": {
    "sensitivity": "medium"
  }
}
```

# Field Description

Field	    Description
|---------|-------------|
timestamp	Shows the time.
sensor_id	Sensor ID.
value	    Sensor value.
detector	Detector used.
parameters  Optional settings.

## 2. Multi-Sensor Request (Correlation)

This example shows how the Backend sends data from multiple sensors to the Correlation service.

# Example

```json
{
  "timestamp": "2026-07-31T20:30:00+10:00",
  "entity_id": "device_01",
  "streams": [
    "temperature",
    "humidity"
  ],
  "values": {
    "temperature": 28.5,
    "humidity": 65.2
  },
  "method": "Pearson",
  "time_window": 10
}
```

# Field Description

 Field        Description 
 |----------|-------------| 
 timestamp    Shows the time. 
 entity_id    Device ID. 
 streams      Sensors to compare. 
 values       Sensor values.
 method       Correlation method. 
 time_window  Number of readings to compare. 

## 3. ThingSpeak-style Request

This example shows data received from a ThingSpeak channel.

# Example

```json
{
  "channel_id": 123456,
  "field1": 28.5,
  "field2": 65.2,
  "created_at": "2026-07-31T20:30:00+10:00"
}
```

# Field Description

 Field        Description 
------------|-------------|
 channel_id   Channel ID. 
 field1       First sensor value. 
 field2       Second sensor value. 
 created_at   Time of the data. 



 ## 4. Field Summary

# Required Fields

- timestamp
- sensor_id / entity_id
- value / values
- streams
- detector / method

# Optional Fields

- parameters
- time_window

# Models Service Fields

- sensor_id
- value
- detector
- parameters

# Correlation Service Fields

- entity_id
- streams
- values
- method
- time_window


## 5. How the Backend Creates the Request

# Models Request

- The Backend gets data from one sensor.
- It creates a request with the sensor data.
- The request is sent to the Models service.

# Correlation Request

- The Backend gets data from multiple sensors.
- It creates one request with all the sensor data.
- The request is sent to the Correlation service.

# ThingSpeak Request

- The Backend gets data from a ThingSpeak channel.
- It reads the sensor values.
- The data is used for analysis.

## 6. Request Structure

The request examples use a simple JSON format. This makes it easier for the Backend, Models, and Correlation services to share data. The same structure can also be used for future integration. 