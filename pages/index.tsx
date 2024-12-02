import { useEffect, useState } from 'react';
import { connect } from 'mqtt/dist/mqtt';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import styles from '@/styles/Home.module.css';

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // MQTT Client setup
    const client = connect('wss://7d79ddcf8af4477491bd13dfe5fa8ba8.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'admin',
      password: 'Admin123',
      protocol: 'wss',
      rejectUnauthorized: false
    });

    client.on('connect', () => {
      setConnectionStatus('Connected');
      client.subscribe('sensor/sht31');
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const newData = {
          temperature: data.temperature,
          humidity: data.humidity,
          timestamp: new Date().toISOString()
        };
        
        setCurrentData(newData);
        setSensorData(prev => {
          const newArray = [...prev, newData];
          return newArray.slice(-50); // Keep last 50 readings
        });
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      setConnectionStatus('Connection Error');
    });

    client.on('offline', () => {
      setConnectionStatus('Offline - Reconnecting...');
    });

    // Cleanup on unmount
    return () => {
      client.end();
    };
  }, []);

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  return (
    <main className={styles.main}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">SHT31 Sensor Dashboard</h1>
          <p className="mt-2 text-gray-600">{connectionStatus}</p>
        </div>

        {/* Current Readings */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Readings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">
                {currentData?.temperature.toFixed(1)}°C
              </p>
              <p className="text-gray-600">Temperature</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">
                {currentData?.humidity.toFixed(1)}%
              </p>
              <p className="text-gray-600">Humidity</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Last Update: {currentData ? formatTime(currentData.timestamp) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Temperature History</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData}>
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
                    stroke="#2563eb"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Humidity History</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData}>
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
                    stroke="#16a34a"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}