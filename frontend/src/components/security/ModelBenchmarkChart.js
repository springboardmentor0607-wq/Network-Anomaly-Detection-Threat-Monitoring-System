import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FaBrain, FaShieldAlt } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ModelBenchmarkChart = ({ latestUpload = {}, rfEval = {}, model = {} }) => {
  // Extract real dynamic metrics from latest uploaded dataset or trained production model
  const accuracy = latestUpload?.accuracy !== null && latestUpload?.accuracy !== undefined
    ? latestUpload.accuracy
    : (rfEval?.accuracy !== null && rfEval?.accuracy !== undefined ? rfEval.accuracy : null);
    
  const precision = latestUpload?.precision !== null && latestUpload?.precision !== undefined
    ? latestUpload.precision
    : (rfEval?.precision !== null && rfEval?.precision !== undefined ? rfEval.precision : null);
    
  const recall = latestUpload?.recall !== null && latestUpload?.recall !== undefined
    ? latestUpload.recall
    : (rfEval?.recall !== null && rfEval?.recall !== undefined ? rfEval.recall : null);
    
  const f1Score = (latestUpload?.f1_score !== null && latestUpload?.f1_score !== undefined)
    ? latestUpload.f1_score
    : ((latestUpload?.f1 !== null && latestUpload?.f1 !== undefined)
        ? latestUpload.f1
        : (rfEval?.f1_score !== null && rfEval?.f1_score !== undefined ? rfEval.f1_score : null));

  const modelName = model?.name || rfEval?.model_name || 'Random Forest';

  const barData = {
    labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
    datasets: [
      {
        label: 'Evaluation Score (%)',
        data: [
          accuracy !== null ? accuracy : 0,
          precision !== null ? precision : 0,
          recall !== null ? recall : 0,
          f1Score !== null ? f1Score : 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.35)',   // Cyber Green
          'rgba(168, 85, 247, 0.35)',  // Electric Violet
          'rgba(245, 158, 11, 0.35)',  // Cyber Amber
          'rgba(56, 189, 248, 0.35)'   // Tech Cyan
        ],
        borderColor: [
          '#22C55E',
          '#A855F7',
          '#F59E0B',
          '#38BDF8'
        ],
        borderWidth: 1.5,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 38,
        categoryPercentage: 0.55,
        barPercentage: 0.7
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#07111f',
        titleColor: '#22C55E',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '700' },
        bodyColor: '#F8FAFC',
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
        borderColor: '#1E3553',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` Metric Score: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94A3B8',
          font: { family: "'Inter', sans-serif", size: 12, weight: '600' }
        },
        grid: {
          display: false
        },
        border: {
          color: 'rgba(30, 53, 83, 0.6)'
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#64748B',
          font: { family: "'JetBrains Mono', monospace", size: 11 },
          stepSize: 25,
          callback: (val) => `${val}%`
        },
        grid: {
          color: 'rgba(30, 53, 83, 0.35)',
          borderDash: [4, 4]
        },
        border: {
          dash: [4, 4],
          color: 'rgba(30, 53, 83, 0.6)'
        }
      }
    }
  };

  return (
    <div className="card" style={{ background: '#0e1e36', borderColor: '#1e3553' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '15px', fontWeight: 600, margin: 0 }}>
            <FaBrain style={{ color: '#22c55e' }} /> Random Forest Model Performance
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>
            Production model evaluation based on the latest uploaded dataset.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cyber-chip" style={{ color: 'var(--primary-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <FaShieldAlt style={{ marginRight: 4 }} /> {modelName} (Production Model)
          </span>
        </div>
      </div>

      <div style={{ height: '240px', width: '100%', position: 'relative' }}>
        {accuracy !== null ? (
          <Bar data={barData} options={barOptions} />
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
            <FaBrain style={{ color: '#f59e0b', fontSize: '28px', marginBottom: '10px' }} />
            <div style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '4px' }}>Ground-truth labels unavailable</div>
            <div>Evaluation metrics cannot be calculated for unlabelled datasets.</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #1e3553' }}>
        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>ACCURACY</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e', marginTop: '3px' }}>
            {accuracy !== null ? `${accuracy}%` : 'N/A'}
          </div>
        </div>

        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>PRECISION</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#a855f7', marginTop: '3px' }}>
            {precision !== null ? `${precision}%` : 'N/A'}
          </div>
        </div>

        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>RECALL</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', marginTop: '3px' }}>
            {recall !== null ? `${recall}%` : 'N/A'}
          </div>
        </div>

        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>F1 SCORE</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
            {f1Score !== null ? `${f1Score}%` : 'N/A'}
          </div>
        </div>

        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>FEATURES</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e', marginTop: '3px' }}>
            {model?.features || rfEval?.features || 78}
          </div>
        </div>

        <div style={{ background: '#07111f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e3553' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>CLASSES</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', marginTop: '3px' }}>
            {model?.classes || rfEval?.classes || 4}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelBenchmarkChart;
