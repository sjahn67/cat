import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SystemStatus {
    led: number;
    co2: boolean;
    cpuTemp: number;
    waterTemp: number;
    fan: boolean;
    isManual: boolean;
}

interface GraphData {
    time: string;
    led: number;
    cpuTemp: number;
    waterTemp: number;
}

function App() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [graphData, setGraphData] = useState<GraphData[]>(() => {
        const saved = localStorage.getItem('graphData');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('graphData', JSON.stringify(graphData));
    }, [graphData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 개발 환경에서는 백엔드 주소 명시 필요, 배포 시에는 상대 경로 사용 가능
                const response = await axios.get('/api/status');
                const data: SystemStatus = response.data;

                setStatus(data);

                setGraphData(prev => {
                    const now = new Date();
                    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                    const newData = [...prev, {
                        time: timeStr,
                        led: data.led,
                        cpuTemp: data.cpuTemp,
                        waterTemp: data.waterTemp
                    }];
                    // 최근 2시간 데이터 유지 (5초 간격 * 1440개)
                    const MAX_DATA_POINTS = 1440;
                    if (newData.length > MAX_DATA_POINTS) return newData.slice(newData.length - MAX_DATA_POINTS);
                    return newData;
                });
            } catch (error) {
                console.error("Error fetching status:", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // 5초마다 갱신
        return () => clearInterval(interval);
    }, []);

    const handleLedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Number(e.target.value);
        // Optimistic update
        setStatus(prev => prev ? { ...prev, led: newVal, isManual: true } : null);
        try {
            await axios.post('/api/led', { value: newVal, manual: true });
        } catch (error) {
            console.error("Error setting LED:", error);
        }
    };

    const setAutoMode = async () => {
        try {
            await axios.post('/api/led', { value: 0, manual: false }); // value is ignored when manual is false
            setStatus(prev => prev ? { ...prev, isManual: false } : null);
        } catch (error) {
            console.error("Error setting auto mode:", error);
        }
    };

    if (!status) return <div className="p-10">Loading...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Aquarium Controller Dashboard</h1>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <StatusCard title="Water Temp" value={`${status.waterTemp} °C`} color={status.waterTemp > 28 ? 'red' : 'blue'} />
                <StatusCard title="CPU Temp" value={`${status.cpuTemp} °C`} />
                <StatusCard title="CO2 Relay" value={status.co2 ? "ON" : "OFF"} color={status.co2 ? 'green' : 'gray'} />
                <StatusCard title="Cooling Fan" value={status.fan ? "ON" : "OFF"} color={status.fan ? 'green' : 'gray'} />
                <StatusCard title="LED Brightness" value={`${status.led.toFixed(2)}%`} />
            </div>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>LED Control</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={status.led}
                        onChange={handleLedChange}
                        style={{ width: '300px' }}
                    />
                    <span style={{ minWidth: '50px' }}>{status.led.toFixed(2)}%</span>
                    <button onClick={setAutoMode} disabled={!status.isManual} style={{ padding: '5px 10px', cursor: status.isManual ? 'pointer' : 'default' }}>
                        {status.isManual ? "Resume Auto Schedule" : "Auto Mode Active"}
                    </button>
                </div>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <h3>LED Brightness History</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis yAxisId="left" orientation="left" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'LED (%)', angle: 90, position: 'insideRight' }} />
                            <Tooltip />
                            <Line yAxisId="right" type="monotone" dataKey="led" stroke="#8884d8" strokeWidth={2} name="LED %" />
                            <Line yAxisId="left" type="monotone" dataKey="waterTemp" stroke="#82ca9d" strokeWidth={2} name="Water °C" />
                            <Line yAxisId="left" type="monotone" dataKey="cpuTemp" stroke="#ff7300" strokeWidth={2} name="CPU °C" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

const StatusCard = ({ title, value, color = 'black' }: { title: string, value: string, color?: string }) => (
    <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '150px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: color }}>{value}</div>
    </div>
);

export default App;
