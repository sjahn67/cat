import { useEffect, useState } from 'react';
import axios from 'axios';

interface ScheduleItem {
    time: string;
    ledValue: number;
    co2: boolean;
}

interface SetupProps {
    onBack: () => void;
}

export default function Setup({ onBack }: SetupProps) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await axios.get('/api/schedule');
            setSchedule(res.data);
        } catch (err) {
            console.error("Failed to fetch schedule", err);
            alert("Failed to load schedule data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('/api/schedule', schedule);
            alert("Schedule saved successfully!");
            onBack();
        } catch (err) {
            console.error("Failed to save schedule", err);
            alert("Failed to save schedule.");
        }
    };

    const handleChange = (index: number, field: keyof ScheduleItem, value: any) => {
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

    if (loading) return <div className="p-10">Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Schedule Setup</h2>
                <button onClick={onBack} style={{ padding: '8px 16px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Time (HHMM)</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>LED (%)</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>CO2</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                    <input
                                        type="text"
                                        value={item.time}
                                        maxLength={4}
                                        onChange={(e) => handleChange(index, 'time', e.target.value)}
                                        style={{ width: '80px', padding: '5px' }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.ledValue}
                                        onChange={(e) => handleChange(index, 'ledValue', Number(e.target.value))}
                                        style={{ width: '80px', padding: '5px' }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                    <input
                                        type="checkbox"
                                        checked={item.co2}
                                        onChange={(e) => handleChange(index, 'co2', e.target.checked)}
                                        style={{ transform: 'scale(1.5)' }}
                                    />
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
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

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAdd} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Add Row
                </button>
                <button onClick={handleSave} style={{ padding: '10px 20px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}