import React, { useState } from 'react';
import API from '../services/api';
import { Terminal, ShieldCheck, ShieldAlert, Play, RotateCcw, Cpu } from 'lucide-react';

const initialFormData = {
  duration: 0,
  protocol_type: "tcp",
  service: "http",
  flag: "SF",
  src_bytes: 1816,
  dst_bytes: 5450,
  land: 0,
  wrong_fragment: 0,
  urgent: 0,
  hot: 0,
  num_failed_logins: 0,
  logged_in: 1,
  num_compromised: 0,
  root_shell: 0,
  su_attempted: 0,
  num_root: 0,
  num_file_creations: 0,
  num_shells: 0,
  num_access_files: 0,
  num_outbound_cmds: 0,
  is_host_login: 0,
  is_guest_login: 0
};

const TestModel = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(value) || value === "" ? value : parseFloat(value)
    }));
  };

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/predict', formData);
      setResult(res.data);
    } catch (err) {
      alert("Inference Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-6 h-6 text-[#00f0ff]" /> Test ML Model
        </h1>
        <p className="text-sm text-slate-400">Input network traffic features manually to execute real-time intrusion classification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Features Form */}
        <form onSubmit={handleTest} className="lg:col-span-2 bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white mb-2">Network Vector Input</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Duration (s)</label>
              <input type="number" step="any" name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Protocol Type</label>
              <select name="protocol_type" value={formData.protocol_type} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1">
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Service</label>
              <select name="service" value={formData.service} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1">
                <option value="http">http</option>
                <option value="smtp">smtp</option>
                <option value="ftp">ftp</option>
                <option value="private">private</option>
                <option value="domain_u">domain_u</option>
                <option value="telnet">telnet</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Src Bytes</label>
              <input type="number" name="src_bytes" value={formData.src_bytes} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Dst Bytes</label>
              <input type="number" name="dst_bytes" value={formData.dst_bytes} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Flag</label>
              <select name="flag" value={formData.flag} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1">
                <option value="SF">SF</option>
                <option value="S0">S0</option>
                <option value="REJ">REJ</option>
                <option value="RSTO">RSTO</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Num Failed Logins</label>
              <input type="number" name="num_failed_logins" value={formData.num_failed_logins} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Logged In</label>
              <select name="logged_in" value={formData.logged_in} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1">
                <option value={1}>1 (True)</option>
                <option value={0}>0 (False)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Hot</label>
              <input type="number" name="hot" value={formData.hot} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Root Shell</label>
              <input type="number" name="root_shell" value={formData.root_shell} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Num Compromised</label>
              <input type="number" name="num_compromised" value={formData.num_compromised} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Is Guest Login</label>
              <input type="number" name="is_guest_login" value={formData.is_guest_login} onChange={handleChange} className="w-full bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg text-sm text-white mt-1" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#1b2a4a]">
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] py-2.5 rounded-xl font-bold transition">
              <Play className="w-4 h-4" /> {loading ? "Evaluating..." : "Test Model"}
            </button>
            <button type="button" onClick={() => setFormData(initialFormData)} className="flex items-center gap-2 bg-[#131f38] hover:bg-[#1b2a4a] text-slate-300 px-5 py-2.5 rounded-xl font-semibold transition border border-[#1b2a4a]">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </form>

        {/* Prediction Results Display */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white">Prediction Result</h2>

          {result ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                result.predicted_class === "NORMAL" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {result.predicted_class === "NORMAL" ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                <div>
                  <h3 className="text-xl font-bold tracking-wide">{result.predicted_class}</h3>
                  <p className="text-xs opacity-80">{result.predicted_class === "NORMAL" ? "Traffic is classified safe." : "Malicious attack pattern identified."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#070b14] border border-[#1b2a4a] p-3 rounded-xl">
                  <span className="text-xs text-slate-400">Confidence Score</span>
                  <div className="text-xl font-bold text-[#00f0ff] mt-1">{result.confidence}%</div>
                </div>
                <div className="bg-[#070b14] border border-[#1b2a4a] p-3 rounded-xl">
                  <span className="text-xs text-slate-400">Risk Score</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">{result.risk_score} / 100</div>
                </div>
              </div>

              <div className="bg-[#070b14] border border-[#1b2a4a] p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
                  <span className="text-slate-400">Severity</span>
                  <span className="font-bold text-rose-400">{result.severity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
                  <span className="text-slate-400">Recommended Action</span>
                  <span className="font-bold text-white">{result.recommended_action}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
                  <span className="text-slate-400">Anomaly Index</span>
                  <span className="font-bold text-slate-200">{result.anomaly_score}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Inference Engine</span>
                  <span className="font-bold text-[#00f0ff]">{result.model_used}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-[#1b2a4a] rounded-xl p-4 text-center">
              <Cpu className="w-10 h-10 mb-2 opacity-50 text-[#00f0ff]" />
              <p className="text-sm">Submit the traffic features to generate dynamic AI classifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestModel;