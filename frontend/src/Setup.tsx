import { useEffect, useState } from 'react';
import axios from 'axios';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ScheduleItem {
    time: string;
    ledValue: number;
    co2: boolean;
}

interface TempConfig {
    startTemp: number;
    endTemp: number;
    enable: boolean;
}

interface CpuFanConfig {
    startTemp: number;
    endTemp: number;
}

interface SetupProps {
    onBack: () => void;
    darkMode: boolean;
}

export default function Setup({ onBack, darkMode }: SetupProps) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [tempConfig, setTempConfig] = useState<TempConfig>({ startTemp: 0, endTemp: 0, enable: false });
    const [cpuFanConfig, setCpuFanConfig] = useState<CpuFanConfig>({ startTemp: 45, endTemp: 70 });
    const [systemInterval, setSystemInterval] = useState<number>(5000);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([fetchSchedule(), fetchConfig()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await axios.get('/api/schedule');
            setSchedule(res.data);
        } catch (err) {
            console.error("Failed to fetch schedule", err);
            alert("Failed to load schedule data.");
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await axios.get('/api/config');
            if (res.data && res.data.tempControl) {
                setTempConfig({
                    startTemp: res.data.tempControl.startTemp,
                    endTemp: res.data.tempControl.endTemp,
                    enable: res.data.tempControl.enable
                });
            }
            if (res.data && res.data.cpuFanControl) {
                setCpuFanConfig({
                    startTemp: res.data.cpuFanControl.startTemp,
                    endTemp: res.data.cpuFanControl.endTemp
                });
            }
            if (res.data && res.data.systemUpdateInterval) {
                setSystemInterval(res.data.systemUpdateInterval);
            }
        } catch (err) {
            console.error("Failed to fetch config", err);
        }
    };

    const handleTempSave = async () => {
        try {
            await axios.post('/api/config/temp', tempConfig);
            alert("Temperature settings saved!");
        } catch (err: any) {
            console.error("Failed to save temp config", err);
            const errorMessage = err.response?.data?.error || "Failed to save temperature settings.";
            alert(errorMessage);
        }
    };

    const handleCpuFanSave = async () => {
        try {
            await axios.post('/api/config/cpu-fan', cpuFanConfig);
            alert("CPU Fan settings saved!");
        } catch (err: any) {
            console.error("Failed to save cpu fan config", err);
            const errorMessage = err.response?.data?.error || "Failed to save CPU fan settings.";
            alert(errorMessage);
        }
    };

    const handleSystemSave = async () => {
        try {
            await axios.post('/api/config/system', { updateInterval: systemInterval });
            alert("System settings saved!");
        } catch (err: any) {
            console.error("Failed to save system config", err);
            const errorMessage = err.response?.data?.error || "Failed to save system settings.";
            alert(errorMessage);
        }
    };

    const handleSave = async () => {
        // Validate time format (HHMM: 0000-2359)
        for (let i = 0; i < schedule.length; i++) {
            const item = schedule[i];
            if (!/^(?:[01]\d|2[0-3])[0-5]\d$/.test(item.time)) {
                alert(`Row ${i + 1}: Invalid time format (${item.time}). Please use HHMM (0000-2359).`);
                return;
            }
        }
        try {
            await axios.post('/api/schedule', schedule);
            alert("Schedule saved successfully!");
            onBack();
        } catch (err: any) {
            console.error("Failed to save schedule", err);
            const errorMessage = err.response?.data?.error || "Failed to save schedule.";
            alert(errorMessage);
        }
    };

    const handleChange = (index: number, field: keyof ScheduleItem, value: any) => {
        if (field === 'time') {
            // Allow only numbers
            if (!/^\d*$/.test(value)) return;
        }
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const handleDelete = (index: number) => {
        if (confirm("Are you sure you want to delete this row?")) {
            const newSchedule = schedule.filter((_, i) => i !== index);
            setSchedule(newSchedule);
        }
    };

    const handleAdd = () => {
        setSchedule([...schedule, { time: "0000", ledValue: 0, co2: false }]);
    };

    const handleSort = () => {
        const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
        setSchedule(sortedSchedule);
    };

    const getGraphData = () => {
        return [...schedule]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(item => {
                const h = parseInt(item.time.substring(0, 2) || "0", 10);
                const m = parseInt(item.time.substring(2, 4) || "0", 10);
                return {
                    ...item,
                    timeNum: (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m),
                    co2Height: item.co2 ? 100 : 0
                };
            });
    };

    if (loading) return <div className="p-10">Loading...</div>;

    const theme = {
        bg: darkMode ? '#1a1a1a' : '#ffffff',
        text: darkMode ? '#e0e0e0' : '#000000',
        cardBg: darkMode ? '#2d2d2d' : '#f9f9f9',
        borderColor: darkMode ? '#444' : '#ccc',
        inputBg: darkMode ? '#333' : '#fff',
        inputText: darkMode ? '#fff' : '#000',
        tableHeaderBg: darkMode ? '#333' : '#f2f2f2',
        tableBorder: darkMode ? '#444' : '#ddd',
        chartGrid: darkMode ? '#444' : '#ccc',
        chartText: darkMode ? '#aaa' : '#666',
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Schedule Setup</h2>
                <button onClick={onBack} style={{ padding: '8px 16px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>

            <div style={{ marginBottom: '20px', border: `1px solid ${theme.borderColor}`, padding: '15px', borderRadius: '8px', backgroundColor: theme.cardBg }}>
                <h3 style={{ marginTop: 0 }}>Temperature Control</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Start Temp (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={tempConfig.startTemp}
                            onChange={(e) => setTempConfig({ ...tempConfig, startTemp: Number(e.target.value) })}
                            style={{ padding: '5px', width: '80px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>End Temp (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={tempConfig.endTemp}
                            onChange={(e) => setTempConfig({ ...tempConfig, endTemp: Number(e.target.value) })}
                            style={{ padding: '5px', width: '80px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                        />
                    </div>
                    <div style={{ paddingBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={tempConfig.enable}
                                onChange={(e) => setTempConfig({ ...tempConfig, enable: e.target.checked })}
                                style={{ marginRight: '5px', transform: 'scale(1.2)' }}
                            />
                            Enable Fan Control
                        </label>
                    </div>
                    <div>
                        <button onClick={handleTempSave} style={{ padding: '6px 12px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Save Temp Settings
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', border: `1px solid ${theme.borderColor}`, padding: '15px', borderRadius: '8px', backgroundColor: theme.cardBg }}>
                <h3 style={{ marginTop: 0 }}>CPU Fan Control (PWM)</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Start Temp (°C)</label>
                        <span style={{ fontSize: '12px', color: '#666' }}>(0% speed below this)</span>
                        <input
                            type="number"
                            value={cpuFanConfig.startTemp}
                            onChange={(e) => setCpuFanConfig({ ...cpuFanConfig, startTemp: Number(e.target.value) })}
                            style={{ padding: '5px', width: '80px', display: 'block', marginTop: '5px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Full Speed Temp (°C)</label>
                        <span style={{ fontSize: '12px', color: '#666' }}>(100% speed above this)</span>
                        <input
                            type="number"
                            value={cpuFanConfig.endTemp}
                            onChange={(e) => setCpuFanConfig({ ...cpuFanConfig, endTemp: Number(e.target.value) })}
                            style={{ padding: '5px', width: '80px', display: 'block', marginTop: '5px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                        />
                    </div>
                    <div>
                        <button onClick={handleCpuFanSave} style={{ padding: '6px 12px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Save CPU Fan Settings
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', border: `1px solid ${theme.borderColor}`, padding: '15px', borderRadius: '8px', backgroundColor: theme.cardBg }}>
                <h3 style={{ marginTop: 0 }}>System Settings</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Update Interval (ms)</label>
                        <input
                            type="number"
                            value={systemInterval}
                            onChange={(e) => setSystemInterval(Number(e.target.value))}
                            style={{ padding: '5px', width: '100px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                        />
                    </div>
                    <div>
                        <button onClick={handleSystemSave} style={{ padding: '6px 12px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Save System Settings
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: theme.tableHeaderBg, textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>Time (HHMM)</th>
                            <th style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>LED (%)</th>
                            <th style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>CO2</th>
                            <th style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>
                                    <input
                                        type="text"
                                        value={item.time}
                                        maxLength={4}
                                        onChange={(e) => handleChange(index, 'time', e.target.value)}
                                        style={{ width: '80px', padding: '5px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.ledValue}
                                        onChange={(e) => handleChange(index, 'ledValue', Number(e.target.value))}
                                        style={{ width: '80px', padding: '5px', backgroundColor: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.borderColor}` }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>
                                    <input
                                        type="checkbox"
                                        checked={item.co2}
                                        onChange={(e) => handleChange(index, 'co2', e.target.checked)}
                                        style={{ transform: 'scale(1.5)' }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: `1px solid ${theme.tableBorder}` }}>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginBottom: '20px', border: `1px solid ${theme.borderColor}`, padding: '10px', borderRadius: '8px', backgroundColor: theme.cardBg }}>
                <h3 style={{ marginTop: 0 }}>Schedule Preview</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={getGraphData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                            <XAxis
                                dataKey="timeNum"
                                type="number"
                                domain={[0, 1440]}
                                tickFormatter={(tick) => {
                                    const h = Math.floor(tick / 60);
                                    const m = tick % 60;
                                    return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
                                }}
                                stroke={theme.chartGrid}
                                tick={{ fill: theme.chartText }}
                            />
                            <YAxis domain={[0, 100]} stroke={theme.chartGrid} tick={{ fill: theme.chartText }} />
                            <Tooltip labelFormatter={(label) => {
                                const h = Math.floor(label / 60);
                                const m = label % 60;
                                return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
                            }} contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.text }} />
                            <Legend />
                            <Area type="stepAfter" dataKey="co2Height" fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} name="CO2 (ON/OFF)" />
                            <Line type="monotone" dataKey="ledValue" stroke="#8884d8" strokeWidth={2} name="LED %" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAdd} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Add Row
                </button>
                <button onClick={handleSort} style={{ padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Sort by Time
                </button>
                <button onClick={handleSave} style={{ padding: '10px 20px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}