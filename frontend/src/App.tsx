import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Setup from './Setup';

interface SystemStatus {
    led: number;
    co2: boolean;
    cpuTemp: number;
    waterTemp: number;
    fan: boolean;
    isManual: boolean;
    cpuFanSpeed: number;
}

interface GraphData {
    time: string;
    led: number;
    cpuTemp: number;
    waterTemp: number;
}

function App() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
    const [view, setView] = useState<'dashboard' | 'setup'>('dashboard');
    const [updateInterval, setUpdateInterval] = useState<number>(5000);
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const [graphData, setGraphData] = useState<GraphData[]>([]);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        axios.get('/api/history')
            .then(res => {
                const formattedData = res.data.map((item: any) => {
                    if (!item.time && item.timestamp) {
                        const d = new Date(item.timestamp);
                        return { ...item, time: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}` };
                    }
                    return item;
                });
                setGraphData(formattedData);
            })
            .catch(err => console.error("Failed to fetch history:", err));
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        axios.get('/api/config').then(res => {
            if (res.data?.systemUpdateInterval) {
                setUpdateInterval(res.data.systemUpdateInterval);
            }
        }).catch(console.error);
    }, []);

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
                    // 최근 24시간 데이터 유지
                    const MAX_DATA_POINTS = (60000 / updateInterval) * 60 * 24;
                    if (newData.length > MAX_DATA_POINTS) return newData.slice(newData.length - MAX_DATA_POINTS);
                    return newData;
                });
            } catch (error) {
                console.error("Error fetching status:", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, updateInterval);
        return () => clearInterval(interval);
    }, [updateInterval]);

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

    const toggleCo2 = async () => {
        const newVal = !status.co2;
        // Optimistic update
        setStatus(prev => prev ? { ...prev, co2: newVal, isManual: true } : null);
        try {
            await axios.post('/api/co2', { value: newVal, manual: true });
        } catch (error) {
            console.error("Error toggling CO2:", error);
        }
    };

    const toggleFan = async () => {
        const newVal = !status.fan;
        setStatus(prev => prev ? { ...prev, fan: newVal, isManual: true } : null);
        try {
            await axios.post('/api/fan', { value: newVal, manual: true });
        } catch (error) {
            console.error("Error toggling Fan:", error);
        }
    };

    const getFilteredData = () => {
        const pointsPerMinute = 60000 / updateInterval;
        let points = 0;
        switch (timeRange) {
            case '1h': points = 60 * pointsPerMinute; break;
            case '6h': points = 6 * 60 * pointsPerMinute; break;
            case '24h': points = 24 * 60 * pointsPerMinute; break;
        }
        const data = graphData.slice(-points);

        // Downsampling: 데이터가 너무 많을 경우 샘플링하여 렌더링 성능 최적화
        const maxPoints = 300;
        if (data.length <= maxPoints) return data;

        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, index) => index % step === 0);
    };

    if (view === 'setup') return <Setup onBack={() => setView('dashboard')} darkMode={darkMode} />;

    const theme = {
        bg: darkMode ? '#1a1a1a' : '#ffffff',
        text: darkMode ? '#e0e0e0' : '#000000',
        cardBg: darkMode ? '#2d2d2d' : '#ffffff',
        borderColor: darkMode ? '#444' : '#ccc',
        inputBg: darkMode ? '#333' : '#fff',
        inputText: darkMode ? '#fff' : '#000',
        chartGrid: darkMode ? '#444' : '#ccc',
        chartText: darkMode ? '#aaa' : '#666',
    };

    if (!status) return <div className="p-10">Loading...</div>;

    const styles = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        .spin { animation: spin 2s linear infinite; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
    `;

    return (
        <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <style>{styles}</style>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', margin: '0 0 10px 0' }}>Aquarium Controller</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            onClick={() => setDarkMode(!darkMode)}
                            style={{ cursor: 'pointer', fontSize: '24px' }}
                            title="Toggle Dark Mode"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </div>
                        <span style={{
                            padding: '5px 10px',
                            borderRadius: '15px',
                            backgroundColor: status.isManual ? '#ff9800' : '#4caf50',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            {status.isManual ? "Manual Mode" : "Auto Mode"}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {currentTime.toLocaleTimeString()}
                        </div>
                        <div
                            onClick={() => setView('setup')}
                            style={{ cursor: 'pointer', fontSize: '24px' }}
                            title="Setup"
                        >
                            ⚙️
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatusCard title="Water Temp" value={`${status.waterTemp.toFixed(1)} °C`} color={status.waterTemp > 28 ? 'red' : (darkMode ? '#4da6ff' : 'blue')} darkMode={darkMode} />
                <StatusCard title="CPU Temp" value={`${status.cpuTemp.toFixed(1)} °C`} darkMode={darkMode} />
                <StatusCard title="CO2 Relay" value={status.co2 ? "ON" : "OFF"} color={status.co2 ? 'green' : 'gray'} onClick={toggleCo2} icon="🫧" animation={status.co2 ? "pulse" : ""} darkMode={darkMode} />
                <StatusCard title="Cooling Fan" value={status.fan ? "ON" : "OFF"} color={status.fan ? 'green' : 'gray'} onClick={toggleFan} icon="🌀" animation={status.fan ? "spin" : ""} darkMode={darkMode} />
                <StatusCard title="CPU Fan Speed" value={`${status.cpuFanSpeed}%`} darkMode={darkMode} />
                <StatusCard title="LED Brightness" value={`${status.led.toFixed(2)}%`} darkMode={darkMode} />
            </div>

            <div style={{ border: `1px solid ${theme.borderColor}`, padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: theme.cardBg }}>
                <h3 style={{ marginTop: 0 }}>LED Control</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={status.led}
                        onChange={handleLedChange}
                        style={{ flex: '1 1 200px', width: '100%', accentColor: darkMode ? '#8884d8' : undefined }}
                    />
                    <span style={{ minWidth: '60px', textAlign: 'right' }}>{status.led.toFixed(2)}%</span>
                    <button onClick={setAutoMode} disabled={!status.isManual} style={{ padding: '8px 12px', cursor: status.isManual ? 'pointer' : 'default', flex: '0 0 auto' }}>
                        {status.isManual ? "Resume Auto Schedule" : "Auto Mode Active"}
                    </button>
                </div>
            </div>

            <div style={{ border: `1px solid ${theme.borderColor}`, padding: '10px', borderRadius: '8px', backgroundColor: theme.cardBg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: '0 0 0 5px' }}>History</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {(['1h', '6h', '24h'] as const).map((range) => (
                            <button key={range} onClick={() => setTimeRange(range)} style={{
                                padding: '5px 10px',
                                backgroundColor: timeRange === range ? '#007bff' : (darkMode ? '#444' : '#f0f0f0'),
                                color: timeRange === range ? 'white' : (darkMode ? '#e0e0e0' : 'black'),
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}>{range}</button>
                        ))}
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={getFilteredData()} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                            <XAxis dataKey="time" tick={{ fontSize: 12, fill: theme.chartText }} stroke={theme.chartGrid} />
                            <YAxis yAxisId="left" orientation="left" width={40} tick={{ fontSize: 12, fill: theme.chartText }} stroke={theme.chartGrid} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} width={40} tick={{ fontSize: 12, fill: theme.chartText }} stroke={theme.chartGrid} />
                            <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.text }} />
                            <Line yAxisId="right" type="monotone" dataKey="led" stroke="#8884d8" strokeWidth={2} name="LED %" dot={false} />
                            <Line yAxisId="left" type="monotone" dataKey="waterTemp" stroke="#82ca9d" strokeWidth={2} name="Water °C" dot={false} />
                            <Line yAxisId="left" type="monotone" dataKey="cpuTemp" stroke="#ff7300" strokeWidth={2} name="CPU °C" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

const StatusCard = ({ title, value, color, onClick, icon, animation, darkMode }: { title: string, value: string, color?: string, onClick?: () => void, icon?: string, animation?: string, darkMode?: boolean }) => (
    <div onClick={onClick} style={{
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
        borderRadius: '8px',
        padding: '10px',
        flex: '1 1 140px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
        color: darkMode ? '#e0e0e0' : '#000'
    }}>
        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: color || (darkMode ? '#e0e0e0' : 'black'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {icon && <span className={animation} style={{ display: 'inline-block' }}>{icon}</span>}
            <span>{value}</span>
        </div>
    </div>
);

export default App;
