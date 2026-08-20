'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge-2';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-6';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

// Metric configurations
const metrics = [
  {
    key: 'packets',
    label: 'Total Packets (Live)',
    format: (val: number) => val.toLocaleString(),
    isNegative: false,
  },
  {
    key: 'bytes',
    label: 'Total Bytes',
    format: (val: number) => val.toLocaleString(),
    isNegative: false,
  },
];

const chartConfig = {
  packets: {
    label: 'Total Packets',
    color: '#3b82f6', // Blue line
  },
  bytes: {
    label: 'Total Bytes',
    color: '#10b981', // Green line
  },
} satisfies ChartConfig;

// Custom Tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const metric = metrics.find((m) => m.key === entry.dataKey);

    if (metric) {
      return (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-sm min-w-[120px]">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-400">{metric.label}:</span>
            <span className="font-semibold text-white">{metric.format(entry.value)}</span>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function AdvancedTrafficChart({ dataset }: { dataset?: string }) {
  const [selectedMetric, setSelectedMetric] = useState<string>('packets');
  const [chartData, setChartData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState({ total_packets: 0, total_alerts: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = dataset ? `?dataset=${encodeURIComponent(dataset)}` : "";
        const [flowRes, summaryRes] = await Promise.all([
          fetch(`http://localhost:8000/api/network/traffic-flow${query}`),
          fetch(`http://localhost:8000/api/network/summary${query}`)
        ]);
        
        if (flowRes.ok) {
          const flow = await flowRes.json();
          setChartData(flow);
        }
        
        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          setSummaryData(summary);
        }
      } catch (err) {
        console.error("Error fetching traffic data", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [dataset]);

  return (
    <div className="w-full">
      <Card className="@container w-full bg-transparent border-none shadow-none rounded-none">
        <CardHeader className="p-0 mb-5 border-b border-white/10">
          {/* Metrics Grid */}
          <div className="grid @2xl:grid-cols-2 grow">
            {metrics.map((metric) => {
              const currentValue = metric.key === 'packets' ? summaryData.total_packets : chartData.reduce((acc, curr) => acc + (curr.bytes || 0), 0);
              return (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={cn(
                    'cursor-pointer flex-1 text-start p-4 last:border-b-0 border-b @2xl:border-b-0 border-white/10 transition-all rounded-lg',
                    selectedMetric === metric.key ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-medium">{metric.label}</span>
                    <Badge className={metric.key === 'packets' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}>
                      <ArrowUp className="size-3 mr-1" /> Active
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white">{metric.format(currentValue)}</div>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-0 py-2">
          <ChartContainer
            config={chartConfig}
            className="h-72 w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-600"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 5,
                bottom: 20,
              }}
              style={{ overflow: 'visible' }}
            >
              {/* Background pattern for chart area only */}
              <defs>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="#e5e7eb" fillOpacity="1" />
                </pattern>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="8"
                    floodColor="rgba(0,0,0,0.1)"
                  />
                </filter>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
                </filter>
              </defs>

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickMargin={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickMargin={10}
                tickCount={6}
                tickFormatter={(value) => {
                  const metric = metrics.find((m) => m.key === selectedMetric);
                  return metric ? metric.format(value) : value.toString();
                }}
              />

              <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#e5e7eb' }} />

              {/* Background pattern for chart area only */}
              <rect
                x="60px"
                y="-20px"
                width="calc(100% - 75px)"
                height="calc(100% - 10px)"
                fill="url(#dotGrid)"
                style={{ pointerEvents: 'none' }}
              />

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={chartConfig[selectedMetric as keyof typeof chartConfig]?.color}
                strokeWidth={2}
                filter="url(#lineShadow)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: chartConfig[selectedMetric as keyof typeof chartConfig]?.color,
                  stroke: 'white',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
