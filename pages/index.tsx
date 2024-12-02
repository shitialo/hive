import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Container, Paper, Typography, Grid, Alert, Box } from '@mui/material';
import mqtt from 'mqtt';
import { format } from 'date-fns';

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface CurrentReadings {
  temperature: number | null;
  humidity: number | null;
  lastUpdate: string | null;
}

export default function Home() {
  const [data, setData] = useState<SensorData[]>([]);
  const [current, setCurrent] = useState<CurrentReadings>({
    temperature: null,
    humidity: null,
    lastUpdate: null
  });
  const [error, setError] = useState<string>('');
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  const connectMqtt = useCallback(() => {
    const mqttClient = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_URL || '', {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      protocol: 'wss',
      rejectUnauthorized: false
    });

    mqttClient.on('connect', () => {
      console.log('Connected to HiveMQ');
      mqttClient.subscribe('sensor/sht31');
      setError('');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const sensorData = JSON.parse(message.toString());
        const timestamp = new Date().toISOString();
        const newReading = { ...sensorData, timestamp };

        setData(prev => [...prev.slice(-50), newReading]);
        setCurrent({
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          lastUpdate: timestamp
        });
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    mqttClient.on('error', (err) => {
      setError('MQTT Error: ' + err.message);
    });

    mqttClient.on('offline', () => {
      setError('MQTT Connection Lost - Attempting to reconnect...');
    });

    setClient(mqttClient);

    return mqttClient;
  }, []);

  useEffect(() => {
    const mqttClient = connectMqtt();
    return () => {
      mqttClient.end();
    };
  }, [connectMqtt]);

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h3" gutterBottom className="text-center mb-8">
        SHT31 Sensor Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Current Readings */}
        <Grid item xs={12}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h6" gutterBottom>
              Current Readings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box className="text-center">
                  <Typography variant="h4" color="primary">
                    {current.temperature?.toFixed(1)}°C
                  </Typography>
                  <Typography variant="subtitle1">Temperature</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box className="text-center">
                  <Typography variant="h4" color="secondary">
                    {current.humidity?.toFixed(1)}%
                  </Typography>
                  <Typography variant="subtitle1">Humidity</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box className="text-center">
                  <Typography variant="body2" color="textSecondary">
                    Last Update: {current.lastUpdate ? formatTime(current.lastUpdate) : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h6" gutterBottom>
              Temperature History
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                />
                <YAxis />
                <Tooltip labelFormatter={formatTime} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2196f3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h6" gutterBottom>
              Humidity History
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                />
                <YAxis />
                <Tooltip labelFormatter={formatTime} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#4caf50"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}