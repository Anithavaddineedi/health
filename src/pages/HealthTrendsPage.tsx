import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useUserRealtime } from '@/hooks/useUserRealtime';

type Range = '7' | '30' | 'all';
type Metric = 'bloodPressure' | 'bloodSugar' | 'hemoglobin';

interface HealthReading {
  id: string;
  display_name: string;
  code: string;
  value: string;
  unit: string;
  record_date: string | null;
  created_at: string;
}

interface ChartReading {
  timestamp: number;
  dateLabel: string;
  bloodPressure: number | null;
  bloodPressureDisplay: string | null;
  bloodSugar: number | null;
  bloodSugarUnit: string | null;
  hemoglobin: number | null;
  hemoglobinUnit: string | null;
}

const metricColors: Record<Metric, string> = {
  bloodPressure: '#16735b',
  bloodSugar: '#d18b36',
  hemoglobin: '#7961b5',
};

function dateKey(date: string) {
  return date.slice(0, 10);
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp);
}

function readingTimestamp(reading: HealthReading) {
  return reading.record_date
    ? new Date(`${reading.record_date}T12:00:00`).getTime()
    : new Date(reading.created_at).getTime();
}

function readingDayKey(reading: HealthReading) {
  return reading.record_date
    ? dateKey(reading.record_date)
    : localDateKey(new Date(reading.created_at));
}

function numericValue(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

function metricFor(reading: HealthReading): Metric | null {
  const name = `${reading.display_name} ${reading.code}`.toLowerCase();
  if (/blood pressure|systolic|diastolic|\bbp\b/.test(name)) return 'bloodPressure';
  if (/blood sugar|blood glucose|fasting glucose|random glucose|\bglucose\b/.test(name)) {
    return 'bloodSugar';
  }
  if (/hemoglobin|haemoglobin/.test(name) && !/glycat|a1c|hba1c/.test(name)) {
    return 'hemoglobin';
  }
  return null;
}

function parseReading(reading: HealthReading, metric: Metric) {
  const unit = reading.unit.trim();
  if (metric === 'bloodPressure') {
    const pressure = reading.value.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})/);
    let systolic = pressure ? Number(pressure[1]) : numericValue(reading.value);
    if (systolic === null || !Number.isFinite(systolic) || systolic <= 0) return null;
    if (/kpa/i.test(unit)) systolic *= 7.50062;
    else if (unit && !/mm\s*\[?hg\]?/i.test(unit)) return null;
    return {
      value: systolic,
      display: `${reading.value.trim()}${unit ? ` ${unit}` : ' mmHg'}`,
    };
  }

  let value = numericValue(reading.value);
  if (value === null) return null;
  if (metric === 'bloodSugar') {
    if (/mmol\s*\/\s*l/i.test(unit)) value *= 18;
    else if (unit && !/mg\s*\/\s*dl/i.test(unit)) return null;
  } else if (/^g\/?l$/i.test(unit)) {
    value /= 10;
  } else if (unit && !/^g\/?dl$/i.test(unit)) {
    return null;
  }
  return { value, display: `${reading.value.trim()}${unit ? ` ${unit}` : ''}` };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number | null; payload: ChartReading }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const values = payload.filter((item) => typeof item.value === 'number' && Number.isFinite(item.value));
  if (!values.length) return null;

  return (
    <div className="rounded-3 border bg-white p-3 shadow-sm">
      <div className="small fw-semibold mb-2">{dateLabel(label ?? point.timestamp)}</div>
      {values.map(({ dataKey, value }) => {
        const metric = dataKey as Metric;
        let display = `${value}`;
        if (metric === 'bloodPressure') display = point.bloodPressureDisplay || display;
        if (metric === 'bloodSugar' && point.bloodSugarUnit) display = point.bloodSugarUnit;
        if (metric === 'hemoglobin' && point.hemoglobinUnit) display = point.hemoglobinUnit;
        const name = metric === 'bloodPressure'
          ? 'Blood Pressure'
          : metric === 'bloodSugar'
            ? 'Blood Sugar'
            : 'Hemoglobin';
        return (
          <div className="small d-flex align-items-center gap-2" key={dataKey}>
            <span
              className="rounded-circle"
              style={{ width: 8, height: 8, backgroundColor: metricColors[metric] }}
            />
            <span>{name}: <strong>{display}</strong></span>
          </div>
        );
      })}
    </div>
  );
}

export function HealthTrendsPage() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [range, setRange] = useState<Range>('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [realtimeError, setRealtimeError] = useState('');

  const loadReadings = useCallback(async () => {
    if (!user) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('medical_records')
      .select('id, display_name, code, value, unit, record_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setReadings(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadReadings();
  }, [loadReadings]);

  useUserRealtime(user?.id, ['medical_records'], loadReadings, setRealtimeError, () => setRealtimeError(''));

  const chartData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (range !== 'all') startDate.setDate(startDate.getDate() - (Number(range) - 1));
    const earliest = localDateKey(startDate);
    const dailyReadings = new Map<string, ChartReading>();

    for (const reading of readings) {
      const metric = metricFor(reading);
      if (!metric) continue;

      const key = readingDayKey(reading);
      if (range !== 'all' && key < earliest) continue;
      const timestamp = readingTimestamp(reading);
      if (!Number.isFinite(timestamp)) continue;

      const parsed = parseReading(reading, metric);
      if (!parsed) continue;

      const dayPoint = dailyReadings.get(key) || {
        timestamp,
        dateLabel: dateLabel(timestamp),
        bloodPressure: null,
        bloodPressureDisplay: null,
        bloodSugar: null,
        bloodSugarUnit: null,
        hemoglobin: null,
        hemoglobinUnit: null,
      };
      dayPoint.timestamp = Math.max(dayPoint.timestamp, timestamp);
      if (metric === 'bloodPressure') {
        dayPoint.bloodPressure = parsed.value;
        dayPoint.bloodPressureDisplay = parsed.display;
      } else if (metric === 'bloodSugar') {
        dayPoint.bloodSugar = parsed.value;
        dayPoint.bloodSugarUnit = parsed.display;
      } else {
        dayPoint.hemoglobin = parsed.value;
        dayPoint.hemoglobinUnit = parsed.display;
      }
      dailyReadings.set(key, dayPoint);
    }

    return Array.from(dailyReadings.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [readings, range]);

  const hasReadings = chartData.some((point) =>
    point.bloodPressure !== null || point.bloodSugar !== null || point.hemoglobin !== null
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>Health Trends</h2>
          <p className="text-muted mb-0">
            Track blood pressure, blood sugar, and hemoglobin from your medical records.
          </p>
        </div>
        <div className="btn-group" role="group" aria-label="Date range">
          {([
            ['7', '7 days'],
            ['30', '30 days'],
            ['all', 'All'],
          ] as const).map(([value, label]) => (
            <button
              className={`btn btn-sm ${range === value ? 'btn-success' : 'btn-outline-success'}`}
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      {realtimeError && <div className="alert alert-warning" role="alert">{realtimeError}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Activity size={19} color="#16735b" />
            <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>Health readings over time</h5>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading readings</span>
              </div>
            </div>
          ) : !hasReadings ? (
            <div className="text-center text-muted py-5">
              <Activity size={36} className="mb-2 opacity-50" />
              <p className="mb-1">No readings available for this period.</p>
              <small>Upload medical records with dated blood pressure, blood sugar, or hemoglobin results to see trends.</small>
            </div>
          ) : (
            <>
              <div className="small text-muted mb-2">
                Separate Y-axes:
                <span className="ms-2" style={{ color: metricColors.bloodPressure }}>Left: Blood Pressure (mmHg)</span>
                <span className="ms-2" style={{ color: metricColors.bloodSugar }}>Right: Blood Sugar (mg/dL)</span>
                <span className="ms-2" style={{ color: metricColors.hemoglobin }}>Inner right: Hemoglobin (g/dL)</span>
                {' '}Missing readings are left blank.
              </div>
              <div style={{ width: '100%', height: 390 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 12, right: 60, left: 4, bottom: 12 }}>
                    <CartesianGrid stroke="#e8efea" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value: number) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(value)}
                      tick={{ fill: '#72837b', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#dfe8e1' }}
                    />
                    <YAxis
                      yAxisId="pressure"
                      orientation="left"
                      tick={{ fill: metricColors.bloodPressure, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <YAxis
                      yAxisId="sugar"
                      orientation="right"
                      tick={{ fill: metricColors.bloodSugar, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="hemoglobin"
                      orientation="right"
                      allowDecimals
                      domain={['auto', 'auto']}
                      tick={{ fill: metricColors.hemoglobin, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      mirror
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value: string) => (
                        <span className="small text-dark">
                          {value === 'bloodPressure' ? 'Blood Pressure' : value === 'bloodSugar' ? 'Blood Sugar' : 'Hemoglobin'}
                        </span>
                      )}
                    />
                    <Line
                      name="bloodPressure"
                      type="monotone"
                      dataKey="bloodPressure"
                      yAxisId="pressure"
                      stroke={metricColors.bloodPressure}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: metricColors.bloodPressure }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line
                      name="bloodSugar"
                      type="monotone"
                      dataKey="bloodSugar"
                      yAxisId="sugar"
                      stroke={metricColors.bloodSugar}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: metricColors.bloodSugar }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line
                      name="hemoglobin"
                      type="monotone"
                      dataKey="hemoglobin"
                      yAxisId="hemoglobin"
                      stroke={metricColors.hemoglobin}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: metricColors.hemoglobin }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="small text-muted mt-2">
                Blood pressure charts the systolic value; tooltips retain the full reading when available.
                When a date has multiple readings for the same metric, the latest saved reading is plotted.
                Records without a clinical date use their saved date. Increase or decrease trends become visible
                when readings are available from multiple dates.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
